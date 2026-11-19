import { NextResponse } from "next/server";
import { conferirPedido, listPedidos } from "@/lib/corrida-bambu";

export const runtime = "nodejs";

// Só consulta cobrança que saiu do formulário da corrida do Bambu. Pago = grava no pedido.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  const pedido = id ? (await listPedidos()).find((p) => p.id === id) : undefined;
  if (!pedido) return NextResponse.json({ error: "Cobrança não encontrada." }, { status: 404 });
  try {
    return NextResponse.json({ pago: await conferirPedido(pedido) });
  } catch (error) {
    console.error("corrida-bambu: falha ao consultar pagamento", error);
    return NextResponse.json({ pago: false });
  }
}
