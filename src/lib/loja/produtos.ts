import type { DatabaseSync } from "node:sqlite";
import { transacao } from "./db";
import type { Produto, Variacao } from "./tipos";

export type ProdutoComVariacoes = Produto & { variacoes: Variacao[] };

export interface DadosVariacao {
  modelo: string;
  tamanho: string;
  estoque: number;
}

export interface DadosProduto {
  nome: string;
  descricao: string;
  preco: number;
  precoPix: number | null;
  parcelasMax: number;
  fotos: string[];
  variacoes: DadosVariacao[];
}

export type DadosAtualizacao = Partial<Omit<DadosProduto, "variacoes">>;

type Linha = Record<string, unknown>;

function paraProduto(r: Linha): Produto {
  return {
    id: Number(r.id),
    slug: String(r.slug),
    nome: String(r.nome),
    descricao: String(r.descricao),
    preco: Number(r.preco),
    precoPix: r.preco_pix === null ? null : Number(r.preco_pix),
    parcelasMax: Number(r.parcelas_max),
    ativo: Number(r.ativo) === 1,
    fotos: JSON.parse(String(r.fotos)) as string[],
    criadoEm: String(r.criado_em),
  };
}

function paraVariacao(r: Linha): Variacao {
  return {
    id: Number(r.id),
    produtoId: Number(r.produto_id),
    modelo: String(r.modelo),
    tamanho: String(r.tamanho),
    estoque: Number(r.estoque),
    ordem: Number(r.ordem),
    ativo: Number(r.ativo) === 1,
  };
}

/** "Camiseta Caiçara" → "camiseta-caicara". */
function slugBase(nome: string): string {
  const s = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "produto";
}

function slugLivre(db: DatabaseSync, nome: string): string {
  const base = slugBase(nome);
  const existe = db.prepare("SELECT 1 FROM produtos WHERE slug = ?");
  let slug = base;
  for (let n = 2; existe.get(slug); n++) slug = `${base}-${n}`;
  return slug;
}

function variacoesDe(db: DatabaseSync, produtoId: number, soAtivas: boolean): Variacao[] {
  const sql = `SELECT * FROM variacoes WHERE produto_id = ?${soAtivas ? " AND ativo = 1" : ""} ORDER BY ordem, id`;
  return (db.prepare(sql).all(produtoId) as Linha[]).map(paraVariacao);
}

function comVariacoes(db: DatabaseSync, linhas: Linha[], soAtivas: boolean): ProdutoComVariacoes[] {
  return linhas.map((r) => {
    const p = paraProduto(r);
    return { ...p, variacoes: variacoesDe(db, p.id, soAtivas) };
  });
}

/** Cria produto e variações numa transação. Slug gerado do nome; repetido ganha `-2`, `-3`... */
export function criarProduto(db: DatabaseSync, dados: DadosProduto): Produto {
  return transacao(db, () => {
    const slug = slugLivre(db, dados.nome);
    const r = db
      .prepare(
        `INSERT INTO produtos (slug, nome, descricao, preco, preco_pix, parcelas_max, ativo, fotos, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?) RETURNING *`,
      )
      .get(
        slug,
        dados.nome.trim(),
        dados.descricao,
        dados.preco,
        dados.precoPix,
        dados.parcelasMax,
        JSON.stringify(dados.fotos),
        new Date().toISOString(),
      ) as Linha;
    const produto = paraProduto(r);
    const ins = db.prepare(
      "INSERT INTO variacoes (produto_id, modelo, tamanho, estoque, ordem, ativo) VALUES (?, ?, ?, ?, ?, 1)",
    );
    dados.variacoes.forEach((v, i) => ins.run(produto.id, v.modelo, v.tamanho, v.estoque, i));
    return produto;
  });
}

/** Atualiza só os campos enviados. O slug não muda (links já enviados continuam valendo). */
export function atualizarProduto(db: DatabaseSync, id: number, dados: DadosAtualizacao): Produto {
  const colunas: [string, string | number | null][] = [];
  if (dados.nome !== undefined) colunas.push(["nome", dados.nome.trim()]);
  if (dados.descricao !== undefined) colunas.push(["descricao", dados.descricao]);
  if (dados.preco !== undefined) colunas.push(["preco", dados.preco]);
  if (dados.precoPix !== undefined) colunas.push(["preco_pix", dados.precoPix]);
  if (dados.parcelasMax !== undefined) colunas.push(["parcelas_max", dados.parcelasMax]);
  if (dados.fotos !== undefined) colunas.push(["fotos", JSON.stringify(dados.fotos)]);

  const r = (
    colunas.length
      ? db
          .prepare(`UPDATE produtos SET ${colunas.map(([c]) => `${c} = ?`).join(", ")} WHERE id = ? RETURNING *`)
          .get(...colunas.map(([, v]) => v), id)
      : db.prepare("SELECT * FROM produtos WHERE id = ?").get(id)
  ) as Linha | undefined;
  if (!r) throw new Error(`Produto ${id} não encontrado`);
  return paraProduto(r);
}

/** Mostra (true) ou oculta (false) o produto na loja. */
export function definirAtivo(db: DatabaseSync, id: number, ativo: boolean): void {
  const r = db.prepare("UPDATE produtos SET ativo = ? WHERE id = ?").run(ativo ? 1 : 0, id);
  if (r.changes === 0) throw new Error(`Produto ${id} não encontrado`);
}

/** Nova variação no fim da ordem do produto. */
export function adicionarVariacao(db: DatabaseSync, produtoId: number, v: DadosVariacao): Variacao {
  const r = db
    .prepare(
      `INSERT INTO variacoes (produto_id, modelo, tamanho, estoque, ordem, ativo)
       VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(ordem) + 1, 0) FROM variacoes WHERE produto_id = ?), 1)
       RETURNING *`,
    )
    .get(produtoId, v.modelo, v.tamanho, v.estoque, produtoId) as Linha;
  return paraVariacao(r);
}

/** Soma `delta` ao estoque e devolve o novo valor. Nunca fica abaixo de 0: delta grande demais para em 0. */
export function ajustarEstoque(db: DatabaseSync, variacaoId: number, delta: number): number {
  const r = db
    .prepare("UPDATE variacoes SET estoque = MAX(0, estoque + ?) WHERE id = ? RETURNING estoque")
    .get(delta, variacaoId) as Linha | undefined;
  if (!r) throw new Error(`Variação ${variacaoId} não encontrada`);
  return Number(r.estoque);
}

/** Vitrine: produtos ativos, só com variações ativas. */
export function listarAtivos(db: DatabaseSync): ProdutoComVariacoes[] {
  const linhas = db.prepare("SELECT * FROM produtos WHERE ativo = 1 ORDER BY id").all() as Linha[];
  return comVariacoes(db, linhas, true);
}

/** Admin: todos os produtos, com todas as variações. */
export function listarTodos(db: DatabaseSync): ProdutoComVariacoes[] {
  const linhas = db.prepare("SELECT * FROM produtos ORDER BY id").all() as Linha[];
  return comVariacoes(db, linhas, false);
}

/** Página pública: só produto ativo, só variações ativas. Oculto ou inexistente → null. */
export function buscarPorSlug(db: DatabaseSync, slug: string): ProdutoComVariacoes | null {
  const r = db.prepare("SELECT * FROM produtos WHERE slug = ? AND ativo = 1").get(slug) as Linha | undefined;
  return r ? comVariacoes(db, [r], true)[0] : null;
}

/** Admin e regras internas: produto mesmo oculto, com todas as variações. Inexistente → null. */
export function buscarPorId(db: DatabaseSync, id: number): ProdutoComVariacoes | null {
  const r = db.prepare("SELECT * FROM produtos WHERE id = ?").get(id) as Linha | undefined;
  return r ? comVariacoes(db, [r], false)[0] : null;
}
