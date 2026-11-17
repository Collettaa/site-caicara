import { NextResponse } from "next/server";
import {
  camisetaAberta,
  corridaBambu,
  criarPixCamiseta,
  emFila,
  isValidCpf,
  listInscricoes,
  normalizeWhatsapp,
  notifyInscricao,
  saveInscricao,
  tamanhos,
  type InscricaoBambu,
  type PixBambu,
  type Tamanho,
} from "@/lib/corrida-bambu";

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

  // Camiseta: só quando está à venda; quem não pede segue inscrito de graça.
  const camiseta = typeof body.camiseta === "string" && body.camiseta ? (body.camiseta as Tamanho) : undefined;
  if (camiseta) {
    if (!camisetaAberta()) return NextResponse.json({ error: "A camiseta não está à venda agora." }, { status: 400 });
    if (!tamanhos.includes(camiseta)) return NextResponse.json({ error: "Escolhe o tamanho da camiseta." }, { status: 400 });
  }
  const cpf = typeof body.cpf === "string" ? body.cpf : "";
  if (camiseta && !isValidCpf(cpf)) {
    return NextResponse.json({ error: "Confere o CPF. Ele é pedido só para gerar o Pix." }, { status: 400 });
  }

  let pix: PixBambu | undefined;
  if (camiseta) {
    try {
      pix = await criarPixCamiseta(nome, cpf, whatsapp, camiseta);
    } catch (error) {
      console.error("corrida-bambu: falha ao gerar Pix", error);
      return NextResponse.json({ error: "Não deu pra gerar o Pix agora. Tenta de novo." }, { status: 502 });
    }
  }

  const inscricao: InscricaoBambu = {
    nome,
    whatsapp,
    criadoEm: new Date().toISOString(),
    ...(camiseta ? { camiseta, pagamentoId: pix?.paymentId } : {}),
  };
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
  return NextResponse.json({ ok: true, pix: pix ?? null });
}
