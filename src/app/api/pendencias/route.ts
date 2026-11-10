import { NextResponse } from "next/server";
import {
  adicionarPendencia,
  agrupar,
  chaveValida,
  hojeSP,
  limparPrazo,
  limparTexto,
  listarPendencias,
  montarAviso,
} from "@/lib/pendencias";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const negado = () => NextResponse.json({ error: "Chave inválida." }, { status: 401 });

/** Lista e texto do aviso do dia (`aviso` null = nada para mandar). Chave no cabeçalho x-chave. */
export async function GET(request: Request) {
  if (!chaveValida(request.headers.get("x-chave"))) return negado();
  const itens = await listarPendencias();
  const hoje = hojeSP();
  const link = `${process.env.SITE_URL ?? "https://caicara.store"}/admin/pendencias`;
  return NextResponse.json({ hoje, ...agrupar(itens, hoje), aviso: montarAviso(itens, hoje, link) });
}

/** Adiciona: { "texto": "...", "prazo": "AAAA-MM-DD" (opcional) }. Reenviar o mesmo texto não duplica. */
export async function POST(request: Request) {
  if (!chaveValida(request.headers.get("x-chave"))) return negado();
  const corpo = (await request.json().catch(() => null)) as { texto?: unknown; prazo?: unknown } | null;
  const texto = limparTexto(corpo?.texto);
  const prazo = limparPrazo(corpo?.prazo);
  if (texto.length < 2) return NextResponse.json({ error: "Falta o texto." }, { status: 400 });
  if (prazo === null) return NextResponse.json({ error: "Prazo em AAAA-MM-DD." }, { status: 400 });
  return NextResponse.json(await adicionarPendencia(texto, prazo, { semRepetir: true }), { status: 201 });
}
