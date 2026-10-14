"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/loja/db";
import { removerFoto, salvarFoto } from "@/lib/loja/fotos";
import { ErroLoja } from "@/lib/loja/pedidos";
import {
  adicionarVariacao,
  ajustarEstoque,
  atualizarProduto,
  buscarPorId,
  criarProduto,
  definirAtivo,
} from "@/lib/loja/produtos";
import { lerDadosProduto, lerVariacao } from "./campos";

export type Estado = { erro?: string; ok?: string } | null;

const ERRO_GERAL = "Não deu pra salvar. Tenta de novo.";

function idValido(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id > 0;
}

/** Loja, página do produto e telas do admin mostram o que acabou de mudar. */
function revalidar(produtoId: number, slug?: string) {
  revalidatePath("/loja");
  if (slug) revalidatePath(`/loja/${slug}`);
  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${produtoId}`);
}

function mensagemDe(e: unknown): string {
  if (e instanceof ErroLoja) return e.message;
  console.error("[admin/produtos]", e);
  return ERRO_GERAL;
}

/** Cria (id "novo") ou atualiza nome, descrição, preços e parcelas. Produto novo nasce oculto. */
export async function salvarProdutoAction(_anterior: Estado, formData: FormData): Promise<Estado> {
  await exigirAdmin();
  const lido = lerDadosProduto(formData);
  if (!lido.ok) return { erro: lido.erro };

  const db = getDb();
  const id = String(formData.get("id") ?? "");
  let novoId: number;
  try {
    if (id === "novo") {
      const p = criarProduto(db, { ...lido.dados, fotos: [], variacoes: [] });
      // Sem foto e sem tamanho ainda: só aparece na loja quando ele ligar.
      definirAtivo(db, p.id, false);
      novoId = p.id;
      revalidar(p.id, p.slug);
    } else {
      const n = Number(id);
      if (!idValido(n) || !buscarPorId(db, n)) return { erro: "Produto não encontrado." };
      const p = atualizarProduto(db, n, lido.dados);
      revalidar(p.id, p.slug);
      return { ok: "Salvo." };
    }
  } catch (e) {
    return { erro: mensagemDe(e) };
  }
  redirect(`/admin/produtos/${novoId}`);
}

/** Chave ativo/oculto. */
export async function ativoAction(id: number, ativo: boolean): Promise<void> {
  await exigirAdmin();
  if (!idValido(id) || typeof ativo !== "boolean") return;
  const db = getDb();
  const p = buscarPorId(db, id);
  if (!p) return;
  definirAtivo(db, id, ativo);
  revalidar(id, p.slug);
}

/** + e − de uma variação. Nunca abaixo de 0 (`ajustarEstoque` garante). */
export async function estoqueAction(variacaoId: number, delta: 1 | -1): Promise<void> {
  await exigirAdmin();
  if (!idValido(variacaoId) || (delta !== 1 && delta !== -1)) return;
  const db = getDb();
  const dono = db
    .prepare("SELECT p.id, p.slug FROM variacoes v JOIN produtos p ON p.id = v.produto_id WHERE v.id = ?")
    .get(variacaoId) as { id: number; slug: string } | undefined;
  if (!dono) return;
  ajustarEstoque(db, variacaoId, delta);
  revalidar(Number(dono.id), String(dono.slug));
}

export async function novaVariacaoAction(produtoId: number, _anterior: Estado, formData: FormData): Promise<Estado> {
  await exigirAdmin();
  if (!idValido(produtoId)) return { erro: "Produto não encontrado." };
  const lido = lerVariacao(formData);
  if (!lido.ok) return { erro: lido.erro };

  const db = getDb();
  const p = buscarPorId(db, produtoId);
  if (!p) return { erro: "Produto não encontrado." };
  const igual = (a: string, b: string) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }) === 0;
  if (p.variacoes.some((v) => igual(v.modelo, lido.dados.modelo) && igual(v.tamanho, lido.dados.tamanho)))
    return { erro: `${lido.dados.modelo} ${lido.dados.tamanho} já existe. Usa o + e o −.` };
  try {
    adicionarVariacao(db, produtoId, lido.dados);
  } catch (e) {
    return { erro: mensagemDe(e) };
  }
  revalidar(produtoId, p.slug);
  return { ok: `${lido.dados.modelo} ${lido.dados.tamanho} adicionado.` };
}

/** Uma foto por chamada (campo "foto"): cada uma até 8 MB sem estourar o limite do corpo. */
export async function adicionarFotoAction(produtoId: number, formData: FormData): Promise<Estado> {
  await exigirAdmin();
  if (!idValido(produtoId)) return { erro: "Produto não encontrado." };
  const arquivo = formData.get("foto");
  if (!(arquivo instanceof File)) return { erro: "Escolhe uma foto." };

  const db = getDb();
  if (!buscarPorId(db, produtoId)) return { erro: "Produto não encontrado." };
  try {
    const url = await salvarFoto(arquivo);
    // Relê depois do await: outra foto pode ter entrado enquanto esta era gravada.
    const p = buscarPorId(db, produtoId);
    if (!p) return { erro: "Produto não encontrado." };
    atualizarProduto(db, produtoId, { fotos: [...p.fotos, url] });
    revalidar(produtoId, p.slug);
    return { ok: "Foto adicionada." };
  } catch (e) {
    return { erro: mensagemDe(e) };
  }
}

/** Tira a foto do produto; o arquivo só é apagado se nenhum outro produto usar. */
export async function removerFotoAction(produtoId: number, url: string): Promise<void> {
  await exigirAdmin();
  if (!idValido(produtoId) || typeof url !== "string") return;
  const db = getDb();
  const p = buscarPorId(db, produtoId);
  if (!p || !p.fotos.includes(url)) return;
  await removerFoto(db, produtoId, url);
  revalidar(produtoId, p.slug);
}

/** Primeira foto é a capa da vitrine. */
export async function capaAction(produtoId: number, url: string): Promise<void> {
  await exigirAdmin();
  if (!idValido(produtoId) || typeof url !== "string") return;
  const db = getDb();
  const p = buscarPorId(db, produtoId);
  if (!p || !p.fotos.includes(url)) return;
  atualizarProduto(db, produtoId, { fotos: [url, ...p.fotos.filter((f) => f !== url)] });
  revalidar(produtoId, p.slug);
}
