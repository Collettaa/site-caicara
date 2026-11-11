import { NextResponse } from "next/server";
import {
  bateriaLabel,
  baterias,
  bateriasLivres,
  criarPixMurph,
  emFila,
  isValidCpf,
  listInscricoes,
  murph,
  normalizeWhatsapp,
  notifyInscricao,
  ocupacao,
  pixAtivo,
  saveInscricao,
  tamanhos,
  versaoOptions,
  vinculoOptions,
  type Bateria,
  type InscricaoMurph,
  type Tamanho,
  type Versao,
  type Vinculo,
} from "@/lib/murph";

export const runtime = "nodejs";

/** Baterias com vaga agora (o formulário atualiza a lista quando alguém pega a última vaga). */
export async function GET() {
  return NextResponse.json({ livres: bateriasLivres(await listInscricoes()) });
}

export async function POST(request: Request) {
  if (!murph.inscricoesAbertas) {
    return NextResponse.json({ error: "Inscrições encerradas." }, { status: 410 });
  }

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
  const bateria = body.bateria as Bateria;
  const versao = body.versao as Versao;
  const camiseta = body.camiseta;
  const tamanho = body.tamanho as Tamanho;

  if (nome.length < 2) return NextResponse.json({ error: "Escreve seu nome." }, { status: 400 });
  if (!whatsapp) return NextResponse.json({ error: "Confere o WhatsApp com DDD." }, { status: 400 });
  if (typeof vinculo !== "string" || !(vinculo in vinculoOptions)) {
    return NextResponse.json({ error: "Diz se você é aluno, TotalPass ou de fora." }, { status: 400 });
  }
  if (!baterias.includes(bateria)) return NextResponse.json({ error: "Escolhe a bateria." }, { status: 400 });
  if (typeof versao !== "string" || !(versao in versaoOptions)) {
    return NextResponse.json({ error: "Escolhe a versão do Murph." }, { status: 400 });
  }
  if (typeof camiseta !== "boolean") return NextResponse.json({ error: "Diz se quer a camiseta." }, { status: 400 });
  if (camiseta && !tamanhos.includes(tamanho)) {
    return NextResponse.json({ error: "Escolhe o tamanho da camiseta." }, { status: 400 });
  }

  // De fora sem camiseta paga a participação no Pix (com camiseta, a participação vem junto).
  // Quem já pagou e se inscreve de novo não paga outra vez.
  const atuais = await listInscricoes();
  const cobrarPix =
    vinculo === "fora" && !camiseta && pixAtivo() && !atuais.some((i) => i.whatsapp === whatsapp && i.pixPago);
  const cpf = typeof body.cpf === "string" ? body.cpf : "";
  if (cobrarPix && !isValidCpf(cpf)) {
    return NextResponse.json({ error: "Confere o CPF. Ele é pedido só para gerar o Pix." }, { status: 400 });
  }
  // Confere a vaga antes de gerar o Pix: não cobra quem não vai caber.
  if (!bateriasLivres(atuais, whatsapp).includes(bateria)) {
    return NextResponse.json(
      { error: `A bateria das ${bateriaLabel(bateria)} acabou de lotar. Escolhe outra.`, livres: bateriasLivres(atuais) },
      { status: 409 },
    );
  }
  let pix = null;
  if (cobrarPix) {
    try {
      pix = await criarPixMurph(nome, cpf, whatsapp);
    } catch (error) {
      // Sem Pix a inscrição vale do mesmo jeito: acerta no WhatsApp.
      console.error("murph: falha ao gerar Pix", error);
    }
  }

  const inscricao: InscricaoMurph = {
    nome,
    whatsapp,
    vinculo,
    bateria,
    versao,
    camiseta,
    ...(camiseta ? { tamanho } : {}),
    ...(pix ? { pagamentoId: pix.paymentId } : {}),
    criadoEm: new Date().toISOString(),
  };

  let resultado: { ok: true; naBateria: number; total: number } | { ok: false; livres: Bateria[] };
  try {
    resultado = await emFila(async () => {
      const lista = await listInscricoes();
      // Quem já está inscrito e troca de bateria não ocupa duas vagas.
      if (!bateriasLivres(lista, whatsapp).includes(bateria)) {
        return { ok: false as const, livres: bateriasLivres(lista) };
      }
      await saveInscricao(inscricao);
      const atual = [...lista.filter((i) => i.whatsapp !== whatsapp), inscricao];
      return { ok: true as const, naBateria: ocupacao(atual)[bateria], total: atual.length };
    });
  } catch (error) {
    console.error("murph: falha ao salvar", error);
    return NextResponse.json({ error: "Não deu pra salvar agora. Tenta de novo." }, { status: 500 });
  }

  if (!resultado.ok) {
    return NextResponse.json(
      { error: `A bateria das ${bateriaLabel(bateria)} acabou de lotar. Escolhe outra.`, livres: resultado.livres },
      { status: 409 },
    );
  }

  await notifyInscricao(inscricao, resultado.naBateria, resultado.total);
  return NextResponse.json({ ok: true, pix });
}
