// Peças comuns às rotas públicas da loja (/api/loja/*). Só servidor.

import { NextResponse } from "next/server";
import { criarCobranca } from "./cobranca";
import { ErroLoja, salvarCobranca, type PedidoComItens } from "./pedidos";
import type { DatabaseSync } from "node:sqlite";

export const LIMITE_CORPO = 20 * 1024;

export const ERRO_PAGAMENTO = "Não deu pra gerar o pagamento agora. Tenta de novo.";

/** Código de pedido gerado por `novoCodigo` (16 caracteres base64url). */
export const CODIGO_VALIDO = /^[A-Za-z0-9_-]{16}$/;

export const erro = (mensagem: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error: mensagem, ...extra }, { status });

export const erroLoja = (e: ErroLoja) => erro(e.message, 400, { motivo: e.codigo });

/** Lê o corpo JSON com limite de tamanho. Devolve a resposta de erro pronta se não der. */
export async function lerJson(
  request: Request,
  limite = LIMITE_CORPO,
): Promise<{ ok: true; corpo: Record<string, unknown> } | { ok: false; resposta: NextResponse }> {
  const declarado = Number(request.headers.get("content-length") ?? 0);
  if (declarado > limite) return { ok: false, resposta: erro("Pedido grande demais.", 413) };
  let texto: string;
  try {
    texto = await request.text();
  } catch {
    return { ok: false, resposta: erro("Dados inválidos.", 400) };
  }
  if (Buffer.byteLength(texto) > limite) return { ok: false, resposta: erro("Pedido grande demais.", 413) };
  try {
    const corpo: unknown = JSON.parse(texto);
    if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) throw new Error("não é objeto");
    return { ok: true, corpo: corpo as Record<string, unknown> };
  } catch {
    return { ok: false, resposta: erro("Dados inválidos.", 400) };
  }
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
