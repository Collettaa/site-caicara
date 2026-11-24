import { NextResponse } from "next/server";
import {
  camisetaAberta,
  corridaBambu,
  criarCobranca,
  descreverItens,
  disponiveis,
  emFila,
  formas,
  isValidCpf,
  limparItens,
  listInscricoes,
  listPedidos,
  normalizeWhatsapp,
  notifyGabriel,
  quantidade,
  salvarPedido,
  saveInscricao,
  tamanhos,
  type CobrancaBambu,
  type Forma,
} from "@/lib/corrida-bambu";

export const runtime = "nodejs";

/**
 * Um envio pode inscrever no treinão, comprar camisetas, ou os dois.
 * Body: { nome, whatsapp, corre: boolean, itens?: {P,M,G,GG}, forma?: "pix"|"cartao", cpf?, site? }
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  // Campo escondido: só robô preenche.
  if (typeof body.site === "string" && body.site.trim()) return NextResponse.json({ ok: true });

  const nome = typeof body.nome === "string" ? body.nome.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  const whatsapp = typeof body.whatsapp === "string" ? normalizeWhatsapp(body.whatsapp) : null;
  if (nome.length < 2) return NextResponse.json({ error: "Escreve seu nome." }, { status: 400 });
  if (!whatsapp) return NextResponse.json({ error: "Confere o WhatsApp com DDD." }, { status: 400 });

  const corre = body.corre !== false;
  const itens = limparItens(body.itens);
  const qtd = quantidade(itens);
  if (!corre && qtd === 0) return NextResponse.json({ error: "Escolhe participar, a camiseta ou os dois." }, { status: 400 });
  if (corre && !corridaBambu.inscricoesAbertas) return NextResponse.json({ error: "Inscrições encerradas." }, { status: 410 });

  let cobranca: CobrancaBambu | undefined;
  if (qtd > 0) {
    if (!camisetaAberta()) return NextResponse.json({ error: "A camiseta não está à venda agora." }, { status: 400 });
    if (qtd > corridaBambu.camiseta.maxPorPedido) {
      return NextResponse.json({ error: `Até ${corridaBambu.camiseta.maxPorPedido} camisetas por pedido.` }, { status: 400 });
    }
    const forma = (body.forma ?? "pix") as Forma;
    if (!formas.includes(forma)) return NextResponse.json({ error: "Escolhe Pix ou cartão." }, { status: 400 });
    const cpf = typeof body.cpf === "string" ? body.cpf : "";
    if (!isValidCpf(cpf)) return NextResponse.json({ error: "Confere o CPF. Ele é pedido só para gerar a cobrança." }, { status: 400 });

    const livres = disponiveis(await listPedidos());
    const faltou = tamanhos.find((t) => (itens[t] ?? 0) > livres[t]);
    if (faltou) {
      const msg = livres[faltou] === 0 ? `Acabou a camiseta ${faltou}.` : `Só tem ${livres[faltou]} camiseta${livres[faltou] > 1 ? "s" : ""} ${faltou}.`;
      return NextResponse.json({ error: `${msg} Ajusta o pedido.` }, { status: 409 });
    }

    try {
      cobranca = await criarCobranca(nome, cpf, whatsapp, itens, forma);
    } catch (error) {
      console.error("corrida-bambu: falha ao gerar cobrança", error);
      return NextResponse.json({ error: "Não deu pra gerar o pagamento agora. Tenta de novo." }, { status: 502 });
    }
  }

  const agora = new Date().toISOString();
  let total = 0;
  try {
    total = await emFila(async () => {
      if (cobranca) {
        await salvarPedido({ id: cobranca.paymentId, nome, whatsapp, itens, total: cobranca.total, forma: cobranca.forma, criadoEm: agora });
      }
      if (corre) await saveInscricao({ nome, whatsapp, criadoEm: agora });
      return (await listInscricoes()).length;
    });
  } catch (error) {
    console.error("corrida-bambu: falha ao salvar", error);
    return NextResponse.json({ error: "Não deu pra salvar agora. Tenta de novo." }, { status: 500 });
  }

  await notifyGabriel([
    corre ? "🏃 Nova inscrição no treinão do Bambu Gastro Bar" : "👕 Pedido de camiseta do treinão do Bambu (sem inscrição)",
    nome,
    `wa.me/${whatsapp}`,
    cobranca ? `Camisetas: ${descreverItens(itens)} · R$ ${cobranca.total} no ${cobranca.forma === "cartao" ? "cartão" : "Pix"} (aguardando)` : null,
    corre ? `Inscritos: ${total}` : null,
  ]);
  return NextResponse.json({ ok: true, inscrito: corre, cobranca: cobranca ?? null });
}
