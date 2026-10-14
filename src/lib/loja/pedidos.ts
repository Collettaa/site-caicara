import crypto from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { transacao } from "./db";
import { parcelasPermitidas, precoUnitario } from "./precos";
import type { Forma, ItemPedido, Pedido, StatusPedido } from "./tipos";

export const RESERVA_MS = 60 * 60 * 1000;
export const MAX_POR_VARIACAO = 5;

export type CodigoErro = "estoque" | "inativo" | "limite" | "parcelas" | "nao_encontrado" | "status";

/** Erro de regra da loja. `message` já é o texto que vai para o cliente. */
export class ErroLoja extends Error {
  constructor(
    public codigo: CodigoErro,
    message: string,
  ) {
    super(message);
    this.name = "ErroLoja";
  }
}

export type PedidoComItens = Pedido & { itens: ItemPedido[] };

export interface ItemEntrada {
  variacaoId: number;
  qtd: number;
}

export interface EntradaPedido {
  nome: string;
  whatsapp: string;
  aceitaMsgs: boolean;
  forma: "pix" | "cartao1" | "cartao2";
  itens: ItemEntrada[];
}

export interface EntradaBalcao {
  itens: ItemEntrada[];
  forma: "balcao_dinheiro" | "balcao_pix" | "balcao_cartao";
  nome?: string;
}

export interface DadosCobranca {
  asaasId: string;
  parcelamentoId?: string;
  pixQr?: string;
  pixCopiaCola?: string;
  invoiceUrl: string;
}

type Linha = Record<string, unknown>;

const texto = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));

function paraPedido(r: Linha): Pedido {
  return {
    id: Number(r.id),
    codigo: String(r.codigo),
    nome: String(r.nome),
    whatsapp: String(r.whatsapp),
    aceitaMsgs: Number(r.aceita_msgs) === 1,
    forma: String(r.forma) as Pedido["forma"],
    origem: String(r.origem) as Pedido["origem"],
    status: String(r.status) as StatusPedido,
    total: Number(r.total),
    liquido: r.liquido === null ? null : Number(r.liquido),
    asaasId: texto(r.asaas_id),
    asaasParcelamentoId: texto(r.asaas_parcelamento_id),
    pixQr: texto(r.pix_qr),
    pixCopiaCola: texto(r.pix_copia_cola),
    invoiceUrl: texto(r.invoice_url),
    reservadoAte: texto(r.reservado_ate),
    criadoEm: String(r.criado_em),
    pagoEm: texto(r.pago_em),
    entregueEm: texto(r.entregue_em),
  };
}

function paraItem(r: Linha): ItemPedido {
  return {
    id: Number(r.id),
    pedidoId: Number(r.pedido_id),
    variacaoId: Number(r.variacao_id),
    qtd: Number(r.qtd),
    precoUnit: Number(r.preco_unit),
    descricao: String(r.descricao),
  };
}

function itensDe(db: DatabaseSync, pedidoId: number): ItemPedido[] {
  return (db.prepare("SELECT * FROM itens WHERE pedido_id = ? ORDER BY id").all(pedidoId) as Linha[]).map(paraItem);
}

function comItens(db: DatabaseSync, p: Pedido): PedidoComItens {
  return { ...p, itens: itensDe(db, p.id) };
}

function pedidoPorId(db: DatabaseSync, id: number): Pedido {
  const r = db.prepare("SELECT * FROM pedidos WHERE id = ?").get(id) as Linha | undefined;
  if (!r) throw new ErroLoja("nao_encontrado", "Pedido não encontrado.");
  return paraPedido(r);
}

function pedidoPorCodigo(db: DatabaseSync, codigo: string): Pedido {
  const r = db.prepare("SELECT * FROM pedidos WHERE codigo = ?").get(codigo) as Linha | undefined;
  if (!r) throw new ErroLoja("nao_encontrado", "Pedido não encontrado.");
  return paraPedido(r);
}

function novoCodigo(): string {
  return crypto.randomBytes(12).toString("base64url"); // 16 caracteres
}

/** Soma linhas repetidas da mesma variação, mantendo a ordem da primeira aparição. */
function agrupar(itens: ItemEntrada[]): ItemEntrada[] {
  const mapa = new Map<number, number>();
  for (const i of itens) mapa.set(Number(i.variacaoId), (mapa.get(Number(i.variacaoId)) ?? 0) + Number(i.qtd));
  return [...mapa].map(([variacaoId, qtd]) => ({ variacaoId, qtd }));
}

interface VariacaoCompleta {
  variacaoId: number;
  modelo: string;
  tamanho: string;
  estoque: number;
  variacaoAtiva: boolean;
  produtoAtivo: boolean;
  nome: string;
  preco: number;
  precoPix: number | null;
  parcelasMax: number;
}

function variacaoCompleta(db: DatabaseSync, variacaoId: number): VariacaoCompleta | null {
  const r = db
    .prepare(
      `SELECT v.id, v.modelo, v.tamanho, v.estoque, v.ativo AS v_ativo,
              p.ativo AS p_ativo, p.nome, p.preco, p.preco_pix, p.parcelas_max
         FROM variacoes v JOIN produtos p ON p.id = v.produto_id
        WHERE v.id = ?`,
    )
    .get(variacaoId) as Linha | undefined;
  if (!r) return null;
  return {
    variacaoId: Number(r.id),
    modelo: String(r.modelo),
    tamanho: String(r.tamanho),
    estoque: Number(r.estoque),
    variacaoAtiva: Number(r.v_ativo) === 1,
    produtoAtivo: Number(r.p_ativo) === 1,
    nome: String(r.nome),
    preco: Number(r.preco),
    precoPix: r.preco_pix === null ? null : Number(r.preco_pix),
    parcelasMax: Number(r.parcelas_max),
  };
}

/** "Camiseta Caiçara · Baby look M" */
function descricaoDe(v: Pick<VariacaoCompleta, "nome" | "modelo" | "tamanho">): string {
  return `${v.nome} · ${v.modelo} ${v.tamanho}`;
}

/**
 * Baixa `qtd` do estoque só se houver. Lança `ErroLoja("estoque")` se faltar — chamar dentro de
 * `transacao`, para que a falha desfaça as baixas anteriores do mesmo pedido.
 */
function baixar(db: DatabaseSync, variacaoId: number, qtd: number, descricao: string): void {
  const r = db
    .prepare("UPDATE variacoes SET estoque = estoque - ? WHERE id = ? AND estoque >= ?")
    .run(qtd, variacaoId, qtd);
  if (r.changes === 0) throw new ErroLoja("estoque", `Esse tamanho esgotou: ${descricao}.`);
}

function devolver(db: DatabaseSync, pedidoId: number): void {
  const upd = db.prepare("UPDATE variacoes SET estoque = estoque + ? WHERE id = ?");
  for (const i of itensDe(db, pedidoId)) upd.run(i.qtd, i.variacaoId);
}

/** Baixa o estoque de todos os itens já gravados do pedido. Faltou um → ErroLoja("estoque"). */
function rebaixar(db: DatabaseSync, pedidoId: number): void {
  for (const i of agruparItens(itensDe(db, pedidoId))) baixar(db, i.variacaoId, i.qtd, i.descricao);
}

function agruparItens(itens: ItemPedido[]): (ItemEntrada & { descricao: string })[] {
  const mapa = new Map<number, ItemEntrada & { descricao: string }>();
  for (const i of itens) {
    const atual = mapa.get(i.variacaoId);
    if (atual) atual.qtd += i.qtd;
    else mapa.set(i.variacaoId, { variacaoId: i.variacaoId, qtd: i.qtd, descricao: i.descricao });
  }
  return [...mapa.values()];
}

/** Tem estoque para todos os itens do pedido? (Sem baixar nada.) */
function temEstoquePara(db: DatabaseSync, pedidoId: number): boolean {
  const ler = db.prepare("SELECT estoque FROM variacoes WHERE id = ?");
  return agruparItens(itensDe(db, pedidoId)).every((i) => {
    const r = ler.get(i.variacaoId) as Linha | undefined;
    return r !== undefined && Number(r.estoque) >= i.qtd;
  });
}

interface Linhas {
  variacao: VariacaoCompleta;
  qtd: number;
}

/** Confere existência, ativo (se `exigirAtivo`), quantidade e devolve as variações. */
function validarItens(db: DatabaseSync, itens: ItemEntrada[], opcoes: { exigirAtivo: boolean; limite: boolean }): Linhas[] {
  if (!Array.isArray(itens) || itens.length === 0) throw new ErroLoja("limite", "Seu carrinho tá vazio.");
  return agrupar(itens).map(({ variacaoId, qtd }) => {
    if (!Number.isInteger(qtd) || qtd < 1) throw new ErroLoja("limite", "Quantidade inválida.");
    if (opcoes.limite && qtd > MAX_POR_VARIACAO) {
      throw new ErroLoja("limite", `Dá pra levar até ${MAX_POR_VARIACAO} peças de cada tamanho.`);
    }
    const v = variacaoCompleta(db, variacaoId);
    if (!v) throw new ErroLoja("inativo", "Um item do carrinho saiu da loja. Tira ele e tenta de novo.");
    if (opcoes.exigirAtivo && (!v.variacaoAtiva || !v.produtoAtivo)) {
      throw new ErroLoja("inativo", `${descricaoDe(v)} saiu da loja. Tira do carrinho e tenta de novo.`);
    }
    return { variacao: v, qtd };
  });
}

function gravarPedido(
  db: DatabaseSync,
  dados: {
    nome: string;
    whatsapp: string;
    aceitaMsgs: boolean;
    forma: Forma;
    origem: "site" | "balcao";
    status: StatusPedido;
    reservadoAte: string | null;
    criadoEm: string;
    pagoEm: string | null;
    entregueEm: string | null;
    liquidoIgualTotal: boolean;
  },
  linhas: Linhas[],
): PedidoComItens {
  const precos = linhas.map(({ variacao, qtd }) => ({
    variacao,
    qtd,
    precoUnit: precoUnitario(variacao, dados.forma),
    descricao: descricaoDe(variacao),
  }));
  for (const p of precos) baixar(db, p.variacao.variacaoId, p.qtd, p.descricao);
  const total = precos.reduce((s, p) => s + p.precoUnit * p.qtd, 0);

  const r = db
    .prepare(
      `INSERT INTO pedidos (codigo, nome, whatsapp, aceita_msgs, forma, origem, status, total, liquido,
                            reservado_ate, criado_em, pago_em, entregue_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    )
    .get(
      novoCodigo(),
      dados.nome,
      dados.whatsapp,
      dados.aceitaMsgs ? 1 : 0,
      dados.forma,
      dados.origem,
      dados.status,
      total,
      dados.liquidoIgualTotal ? total : null,
      dados.reservadoAte,
      dados.criadoEm,
      dados.pagoEm,
      dados.entregueEm,
    ) as Linha;
  const pedido = paraPedido(r);
  const ins = db.prepare(
    "INSERT INTO itens (pedido_id, variacao_id, qtd, preco_unit, descricao) VALUES (?, ?, ?, ?, ?)",
  );
  for (const p of precos) ins.run(pedido.id, p.variacao.variacaoId, p.qtd, p.precoUnit, p.descricao);
  return comItens(db, pedido);
}

/**
 * Pedido do site: valida, calcula o preço no servidor (o cliente não manda preço), baixa o estoque e
 * reserva por 1h. Tudo numa transação: faltou uma peça, nada é gravado.
 */
export function criarPedido(db: DatabaseSync, entrada: EntradaPedido, agora: Date): PedidoComItens {
  return transacao(db, () => {
    const linhas = validarItens(db, entrada.itens, { exigirAtivo: true, limite: true });
    if (entrada.forma === "cartao2" && parcelasPermitidas(linhas.map((l) => l.variacao)) < 2) {
      throw new ErroLoja("parcelas", "Esse carrinho só pode ser pago em 1x no cartão.");
    }
    return gravarPedido(
      db,
      {
        nome: entrada.nome.trim(),
        whatsapp: entrada.whatsapp,
        aceitaMsgs: entrada.aceitaMsgs,
        forma: entrada.forma,
        origem: "site",
        status: "aguardando",
        reservadoAte: new Date(agora.getTime() + RESERVA_MS).toISOString(),
        criadoEm: agora.toISOString(),
        pagoEm: null,
        entregueEm: null,
        liquidoIgualTotal: false,
      },
      linhas,
    );
  });
}

/** Reservas vencidas viram `expirado` e devolvem o estoque. Retorna os pedidos expirados. */
export function expirarVencidos(db: DatabaseSync, agora: Date): Pedido[] {
  return transacao(db, () => {
    const vencidos = (
      db
        .prepare("SELECT * FROM pedidos WHERE status = 'aguardando' AND reservado_ate <= ? ORDER BY id")
        .all(agora.toISOString()) as Linha[]
    ).map(paraPedido);
    const upd = db.prepare("UPDATE pedidos SET status = 'expirado' WHERE id = ? AND status = 'aguardando'");
    for (const p of vencidos) {
      upd.run(p.id);
      devolver(db, p.id);
    }
    return vencidos.map((p) => pedidoPorId(db, p.id));
  });
}

/** Pedido expirado tenta reservar de novo (mesmas regras de estoque). Limpa a cobrança antiga. */
export function reativar(db: DatabaseSync, codigo: string, agora: Date): Pedido {
  return transacao(db, () => {
    const p = pedidoPorCodigo(db, codigo);
    if (p.status !== "expirado") throw new ErroLoja("status", "Esse pedido não está vencido.");
    const itens = itensDe(db, p.id);
    for (const i of itens) {
      const v = variacaoCompleta(db, i.variacaoId);
      if (!v || !v.variacaoAtiva || !v.produtoAtivo) {
        throw new ErroLoja("inativo", "Um item desse pedido saiu da loja.");
      }
    }
    rebaixar(db, p.id);
    db.prepare(
      `UPDATE pedidos SET status = 'aguardando', reservado_ate = ?, asaas_id = NULL, asaas_parcelamento_id = NULL,
              pix_qr = NULL, pix_copia_cola = NULL, invoice_url = NULL
        WHERE id = ?`,
    ).run(new Date(agora.getTime() + RESERVA_MS).toISOString(), p.id);
    return pedidoPorId(db, p.id);
  });
}

/**
 * Desfaz uma reativação cuja cobrança não saiu: `aguardando` sem cobrança volta para `expirado` e
 * devolve o estoque. Qualquer outro caso (já tem cobrança, já pagou) não muda nada.
 */
export function voltarParaExpirado(db: DatabaseSync, id: number): Pedido {
  return transacao(db, () => {
    const p = pedidoPorId(db, id);
    if (p.status !== "aguardando" || p.asaasId !== null) return p;
    devolver(db, p.id);
    db.prepare("UPDATE pedidos SET status = 'expirado' WHERE id = ?").run(id);
    return pedidoPorId(db, id);
  });
}

/**
 * Pagamento confirmado. Idempotente: já pago/entregue/pago_sem_peca → `mudou: false`.
 * Cancelado depois de pago (`pagoEm` preenchido) → `mudou: false`, nada muda (o dono já decidiu).
 * Expirado ou cancelado antes de pagar: reserva de novo se houver estoque (`pago`); senão `pago_sem_peca`,
 * sem baixar nada.
 */
export function marcarPago(
  db: DatabaseSync,
  codigo: string,
  liquido: number | null,
  agora: Date,
): { pedido: Pedido; mudou: boolean } {
  return transacao(db, () => {
    const p = pedidoPorCodigo(db, codigo);
    let status: StatusPedido;
    if (p.status === "aguardando") {
      status = "pago";
    } else if (p.status === "expirado" || (p.status === "cancelado" && p.pagoEm === null)) {
      if (temEstoquePara(db, p.id)) {
        rebaixar(db, p.id);
        status = "pago";
      } else {
        status = "pago_sem_peca";
      }
    } else {
      return { pedido: p, mudou: false };
    }
    db.prepare("UPDATE pedidos SET status = ?, liquido = ?, pago_em = ? WHERE id = ?").run(
      status,
      liquido,
      agora.toISOString(),
      p.id,
    );
    return { pedido: pedidoPorId(db, p.id), mudou: true };
  });
}

/**
 * Cliente retirou a peça. Vale para `pago` e `pago_sem_peca`; já entregue não muda.
 * `pago_sem_peca`: se a peça original voltou ao estoque, baixa agora. Se não, entrega mesmo assim e
 * devolve `ajusteManual: true` — o dono trocou o tamanho e precisa tirar a peça entregue com o botão −.
 */
export function marcarEntregue(db: DatabaseSync, id: number, agora: Date): { pedido: Pedido; ajusteManual: boolean } {
  return transacao(db, () => {
    const p = pedidoPorId(db, id);
    if (p.status === "entregue") return { pedido: p, ajusteManual: false };
    if (p.status !== "pago" && p.status !== "pago_sem_peca") {
      throw new ErroLoja("status", "Só dá pra entregar pedido pago.");
    }
    let ajusteManual = false;
    if (p.status === "pago_sem_peca") {
      if (temEstoquePara(db, p.id)) rebaixar(db, p.id);
      else ajusteManual = true;
    }
    db.prepare("UPDATE pedidos SET status = 'entregue', entregue_em = ? WHERE id = ?").run(agora.toISOString(), id);
    return { pedido: pedidoPorId(db, id), ajusteManual };
  });
}

/**
 * Cancela o pedido. Devolve o estoque só se ele segurava peça (`aguardando` ou `pago`).
 * Entregue não cancela (a peça já saiu): ErroLoja "status".
 */
export function cancelar(db: DatabaseSync, id: number): Pedido {
  return transacao(db, () => {
    const p = pedidoPorId(db, id);
    if (p.status === "cancelado") return p;
    if (p.status === "entregue") throw new ErroLoja("status", "Pedido entregue não cancela.");
    if (p.status === "aguardando" || p.status === "pago") devolver(db, p.id);
    db.prepare("UPDATE pedidos SET status = 'cancelado' WHERE id = ?").run(id);
    return pedidoPorId(db, id);
  });
}

/** Venda no balcão: baixa o estoque e já nasce `entregue`, paga agora, líquido = total. */
export function vendaBalcao(db: DatabaseSync, entrada: EntradaBalcao, agora: Date): PedidoComItens {
  return transacao(db, () => {
    const linhas = validarItens(db, entrada.itens, { exigirAtivo: false, limite: false });
    const quando = agora.toISOString();
    return gravarPedido(
      db,
      {
        nome: entrada.nome?.trim() || "Balcão",
        whatsapp: "",
        aceitaMsgs: false,
        forma: entrada.forma,
        origem: "balcao",
        status: "entregue",
        reservadoAte: null,
        criadoEm: quando,
        pagoEm: quando,
        entregueEm: quando,
        liquidoIgualTotal: true,
      },
      linhas,
    );
  });
}

/** Pedidos nos status pedidos, mais recentes primeiro, com itens. */
export function listarPorStatus(db: DatabaseSync, status: StatusPedido[]): PedidoComItens[] {
  if (status.length === 0) return [];
  const linhas = db
    .prepare(`SELECT * FROM pedidos WHERE status IN (${status.map(() => "?").join(", ")}) ORDER BY criado_em DESC, id DESC`)
    .all(...status) as Linha[];
  return linhas.map((r) => comItens(db, paraPedido(r)));
}

export function buscarPorCodigo(db: DatabaseSync, codigo: string): PedidoComItens | null {
  const r = db.prepare("SELECT * FROM pedidos WHERE codigo = ?").get(codigo) as Linha | undefined;
  return r ? comItens(db, paraPedido(r)) : null;
}

/** Aguardando pagamento com cobrança criada no Asaas (o verificador consulta esses). */
export function abertosComCobranca(db: DatabaseSync): Pedido[] {
  return (
    db.prepare("SELECT * FROM pedidos WHERE status = 'aguardando' AND asaas_id IS NOT NULL ORDER BY id").all() as Linha[]
  ).map(paraPedido);
}

export function salvarCobranca(db: DatabaseSync, id: number, c: DadosCobranca): void {
  const r = db
    .prepare(
      `UPDATE pedidos SET asaas_id = ?, asaas_parcelamento_id = ?, pix_qr = ?, pix_copia_cola = ?, invoice_url = ?
        WHERE id = ?`,
    )
    .run(c.asaasId, c.parcelamentoId ?? null, c.pixQr ?? null, c.pixCopiaCola ?? null, c.invoiceUrl, id);
  if (r.changes === 0) throw new ErroLoja("nao_encontrado", "Pedido não encontrado.");
}
