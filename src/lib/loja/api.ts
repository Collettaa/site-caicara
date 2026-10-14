// Peças comuns às rotas públicas da loja (/api/loja/*). Só servidor.

import type { DatabaseSync } from "node:sqlite";
import { NextResponse } from "next/server";
import { criarCobranca } from "./cobranca";
import { ErroLoja, salvarCobranca, type PedidoComItens } from "./pedidos";

export const LIMITE_CORPO = 20 * 1024;

export const ERRO_PAGAMENTO = "Não deu pra gerar o pagamento agora. Tenta de novo.";

/** Código de pedido gerado por `novoCodigo` (16 caracteres base64url). */
export const CODIGO_VALIDO = /^[A-Za-z0-9_-]{16}$/;

export const erro = (mensagem: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error: mensagem, ...extra }, { status });

export const erroLoja = (e: ErroLoja) => erro(e.message, 400, { motivo: e.codigo });

/**
 * Lê o corpo em stream e para assim que passar do limite (vale para chunked, sem Content-Length).
 * `null` = grande demais.
 */
export async function lerTextoLimitado(request: Request, limite: number): Promise<string | null> {
  const declarado = Number(request.headers.get("content-length") ?? 0);
  if (declarado > limite) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const pedacos: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limite) {
      await reader.cancel().catch(() => {});
      return null;
    }
    pedacos.push(value);
  }
  return Buffer.concat(pedacos).toString("utf8");
}

/** Lê o corpo JSON com limite de tamanho. Devolve a resposta de erro pronta se não der. */
export async function lerJson(
  request: Request,
  limite = LIMITE_CORPO,
): Promise<{ ok: true; corpo: Record<string, unknown> } | { ok: false; resposta: NextResponse }> {
  let texto: string | null;
  try {
    texto = await lerTextoLimitado(request, limite);
  } catch {
    return { ok: false, resposta: erro("Dados inválidos.", 400) };
  }
  if (texto === null) return { ok: false, resposta: erro("Pedido grande demais.", 413) };
  try {
    const corpo: unknown = JSON.parse(texto);
    if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) throw new Error("não é objeto");
    return { ok: true, corpo: corpo as Record<string, unknown> };
  } catch {
    return { ok: false, resposta: erro("Dados inválidos.", 400) };
  }
}

// ---- Barreira contra abuso ----

export const MAX_ABERTOS_POR_WHATSAPP = 2;
export const MAX_PEDIDOS_POR_IP = 5;
const JANELA_IP_MS = 60 * 60 * 1000;

const memoria = globalThis as typeof globalThis & {
  __lojaLimiteIp?: Map<string, number[]>;
  __lojaUltimaConsulta?: Map<string, number>;
};

/** IP do cliente: primeiro valor de x-forwarded-for (Traefik), senão "local". */
export function ipDe(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Conta uma tentativa do IP. `false` = já fez 5 na última hora (essa não conta). */
export function registrarTentativaIp(ip: string, agora = Date.now()): boolean {
  const mapa = (memoria.__lojaLimiteIp ??= new Map<string, number[]>());
  const recentes = (mapa.get(ip) ?? []).filter((t) => agora - t < JANELA_IP_MS);
  if (recentes.length >= MAX_PEDIDOS_POR_IP) {
    mapa.set(ip, recentes);
    return false;
  }
  recentes.push(agora);
  mapa.set(ip, recentes);
  if (mapa.size > 5000) {
    for (const [k, v] of mapa) if (v.every((t) => agora - t >= JANELA_IP_MS)) mapa.delete(k);
  }
  return true;
}

export function abertosDoWhatsapp(db: DatabaseSync, whatsapp: string): number {
  const r = db
    .prepare("SELECT COUNT(*) AS n FROM pedidos WHERE whatsapp = ? AND status = 'aguardando'")
    .get(whatsapp) as { n: number };
  return Number(r.n);
}

export const ERRO_ABERTOS = "Você já tem pedidos em aberto. Paga um deles ou espera a reserva vencer.";
export const ERRO_IP = "Muitas tentativas. Tenta de novo daqui a pouco.";

/** WhatsApp com 2 pedidos abertos ou IP acima de 5/h → resposta 429; senão null (e conta a tentativa). */
export function barreira(db: DatabaseSync, request: Request, whatsapp: string): NextResponse | null {
  if (abertosDoWhatsapp(db, whatsapp) >= MAX_ABERTOS_POR_WHATSAPP) return erro(ERRO_ABERTOS, 429);
  if (!registrarTentativaIp(ipDe(request))) return erro(ERRO_IP, 429);
  return null;
}

// ---- Consulta ao Asaas pela tela do pedido ----

export const INTERVALO_CONSULTA_MS = 20 * 1000;

/** Pode consultar o Asaas para este código agora? Marca a consulta se puder (1 a cada 20 s). */
export function podeConsultar(codigo: string, agora = Date.now()): boolean {
  const mapa = (memoria.__lojaUltimaConsulta ??= new Map<string, number>());
  const ultima = mapa.get(codigo);
  if (ultima !== undefined && agora - ultima < INTERVALO_CONSULTA_MS) return false;
  mapa.set(codigo, agora);
  if (mapa.size > 5000) {
    for (const [k, t] of mapa) if (agora - t >= INTERVALO_CONSULTA_MS) mapa.delete(k);
  }
  return true;
}

/**
 * Gera a cobrança no Asaas e grava no pedido. CPF só passa daqui para o Asaas.
 * Falhou → lança; quem chama desfaz a reserva.
 */
export async function cobrar(db: DatabaseSync, pedido: PedidoComItens, cpf: string): Promise<void> {
  const cobranca = await criarCobranca(pedido, { nome: pedido.nome, cpf, whatsapp: pedido.whatsapp });
  salvarCobranca(db, pedido.id, cobranca);
}

/** Mensagem de erro para log sem dados do cliente (o CPF já sai mascarado de `criarCobranca`). */
export const paraLog = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 300);
