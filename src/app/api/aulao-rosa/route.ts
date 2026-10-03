import { NextResponse } from "next/server";
import {
  listInscricoes,
  normalizeWhatsapp,
  notifyInscricao,
  saveInscricao,
  vinculoOptions,
  type Vinculo,
} from "@/lib/aulao-rosa";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  // Campo escondido: só robô preenche.
  if (typeof body.site === "string" && body.site.trim()) {
    return NextResponse.json({ ok: true });
  }

  const nome = typeof body.nome === "string" ? body.nome.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  const whatsapp = typeof body.whatsapp === "string" ? normalizeWhatsapp(body.whatsapp) : null;
  const vinculo = body.vinculo as Vinculo;

  if (nome.length < 2) {
    return NextResponse.json({ error: "Escreve seu nome." }, { status: 400 });
  }
  if (!whatsapp) {
    return NextResponse.json({ error: "Confere o WhatsApp com DDD." }, { status: 400 });
  }
  if (!(vinculo in vinculoOptions)) {
    return NextResponse.json({ error: "Escolhe como você vem pra aula." }, { status: 400 });
  }

  const inscricao = { nome, whatsapp, vinculo, criadoEm: new Date().toISOString() };

  try {
    await saveInscricao(inscricao);
  } catch (error) {
    console.error("aulao-rosa: falha ao salvar", error);
    return NextResponse.json({ error: "Não deu pra salvar agora. Tenta de novo." }, { status: 500 });
  }

  const total = (await listInscricoes()).length;
  await notifyInscricao(inscricao, total);

  return NextResponse.json({ ok: true });
}
