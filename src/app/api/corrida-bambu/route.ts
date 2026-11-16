import { NextResponse } from "next/server";
import { corridaBambu, emFila, listInscricoes, normalizeWhatsapp, notifyInscricao, saveInscricao } from "@/lib/corrida-bambu";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!corridaBambu.inscricoesAbertas) {
    return NextResponse.json({ error: "Inscrições encerradas." }, { status: 410 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  // Campo escondido: só robô preenche.
  if (typeof body.site === "string" && body.site.trim()) return NextResponse.json({ ok: true });

  const nome = typeof body.nome === "string" ? body.nome.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  const whatsapp = typeof body.whatsapp === "string" ? normalizeWhatsapp(body.whatsapp) : null;
  if (nome.length < 2) return NextResponse.json({ error: "Escreve seu nome." }, { status: 400 });
  if (!whatsapp) return NextResponse.json({ error: "Confere o WhatsApp com DDD." }, { status: 400 });

  const inscricao = { nome, whatsapp, criadoEm: new Date().toISOString() };
  let total: number;
  try {
    total = await emFila(async () => {
      await saveInscricao(inscricao);
      return (await listInscricoes()).length;
    });
  } catch (error) {
    console.error("corrida-bambu: falha ao salvar", error);
    return NextResponse.json({ error: "Não deu pra salvar agora. Tenta de novo." }, { status: 500 });
  }
  await notifyInscricao(inscricao, total);
  return NextResponse.json({ ok: true });
}
