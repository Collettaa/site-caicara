import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { lerTextoLimitado, paraLog } from "@/lib/loja/api";
import { consultarPagamento } from "@/lib/loja/cobranca";
import { getDb } from "@/lib/loja/db";
import { buscarPorCodigo, marcarPago } from "@/lib/loja/pedidos";
import { dispararCiclo } from "@/lib/loja/verificador";

export const runtime = "nodejs";

const EVENTOS_PAGO = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);
const LIMITE = 100 * 1024;

const ok = () => NextResponse.json({ ok: true });

/** Compara em tempo constante (hash dos dois lados: tamanho diferente não vaza). */
function tokenConfere(recebido: string | null): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado || !recebido) return false;
  const h = (s: string) => crypto.createHash("sha256").update(s).digest();
  return crypto.timingSafeEqual(h(recebido), h(esperado));
}

// Webhook da conta Asaas da loja. O corpo só diz QUAL pedido olhar; se pagou, quem diz é o Asaas.
// Mensagens ficam com o verificador (idempotente pela tabela `mensagens`).
export async function POST(request: Request) {
  if (!tokenConfere(request.headers.get("asaas-access-token"))) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  let corpo: { event?: unknown; payment?: { externalReference?: unknown } };
  try {
    const texto = await lerTextoLimitado(request, LIMITE);
    if (texto === null) return ok();
    corpo = JSON.parse(texto);
  } catch {
    return ok();
  }

  const evento = typeof corpo?.event === "string" ? corpo.event : "";
  const ref = corpo?.payment?.externalReference;
  if (!EVENTOS_PAGO.has(evento) || typeof ref !== "string" || !ref.startsWith("loja:")) return ok();

  const db = getDb();
  const pedido = buscarPorCodigo(db, ref.slice("loja:".length));
  if (!pedido) return ok();

  try {
    const r = await consultarPagamento(pedido);
    if (r.pago) marcarPago(db, pedido.codigo, r.liquido, new Date());
  } catch (e) {
    // 500 faz o Asaas reenviar; o verificador também confere os pedidos em aberto.
    console.error(`loja: webhook não conseguiu confirmar o pedido ${pedido.id}`, paraLog(e));
    return NextResponse.json({ error: "falha ao confirmar" }, { status: 500 });
  }

  dispararCiclo();
  return ok();
}
