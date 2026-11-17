import { NextResponse } from "next/server";
import { conferirPix, listInscricoes } from "@/lib/corrida-bambu";

export const runtime = "nodejs";

// Só consulta cobrança que saiu do formulário da corrida do Bambu. Pago = grava pixPago.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  const inscricao = id ? (await listInscricoes()).find((i) => i.pagamentoId === id) : undefined;
  if (!inscricao) return NextResponse.json({ error: "Cobrança não encontrada." }, { status: 404 });
  try {
    return NextResponse.json({ pago: await conferirPix(inscricao) });
  } catch (error) {
    console.error("corrida-bambu: falha ao consultar Pix", error);
    return NextResponse.json({ pago: false });
  }
}
