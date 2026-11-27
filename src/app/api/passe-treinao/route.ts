import { NextResponse } from "next/server";
import { avisarGabriel, horarioValido, limparInstagram, listarPasses, normalizeWhatsapp, passeTreinao, salvarPasse } from "@/lib/passe-treinao";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  // Campo escondido: só robô preenche.
  if (typeof body.site === "string" && body.site.trim()) return NextResponse.json({ ok: true });

  const nome = typeof body.nome === "string" ? body.nome.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  const whatsapp = typeof body.whatsapp === "string" ? normalizeWhatsapp(body.whatsapp) : null;
  const agora = new Date();

  if (nome.length < 2) return NextResponse.json({ error: "Escreve seu nome." }, { status: 400 });
  if (!whatsapp) return NextResponse.json({ error: "Confere o WhatsApp com DDD." }, { status: 400 });
  if (!horarioValido(body.data, body.hora, agora)) {
    return NextResponse.json({ error: `Escolhe o dia e o horário da 1ª aula (até ${passeTreinao.comecarAteLabel}).` }, { status: 400 });
  }

  const passe = {
    nome,
    whatsapp,
    ...(limparInstagram(body.instagram) ? { instagram: limparInstagram(body.instagram) } : {}),
    data: body.data as string,
    hora: body.hora as string,
    origem: passeTreinao.origem,
    criadoEm: agora.toISOString(),
  };
  try {
    await salvarPasse(passe);
  } catch (error) {
    console.error("passe-treinao: falha ao salvar", error);
    return NextResponse.json({ error: "Não deu pra salvar agora. Tenta de novo." }, { status: 500 });
  }

  try {
    await avisarGabriel(passe, (await listarPasses()).length);
  } catch (error) {
    console.error("passe-treinao: aviso não saiu", error);
  }
  return NextResponse.json({ ok: true });
}
