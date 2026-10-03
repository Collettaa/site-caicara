import { NextResponse } from "next/server";
import { isPixPaid, listInscricoes } from "@/lib/aulao-rosa";

export const runtime = "nodejs";

// Só consulta cobrança que saiu do formulário do Aulão.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  const inscricoes = await listInscricoes();
  if (!id || !inscricoes.some((i) => i.pagamentoId === id)) {
    return NextResponse.json({ error: "Cobrança não encontrada." }, { status: 404 });
  }

  try {
    return NextResponse.json({ pago: await isPixPaid(id) });
  } catch (error) {
    console.error("aulao-rosa: falha ao consultar Pix", error);
    return NextResponse.json({ pago: false });
  }
}
