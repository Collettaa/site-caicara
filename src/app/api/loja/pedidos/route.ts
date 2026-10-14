import { NextResponse } from "next/server";
import { isValidCpf, normalizeWhatsapp } from "@/lib/contato";
import { cobrar, ERRO_PAGAMENTO, erro, erroLoja, lerJson, paraLog } from "@/lib/loja/api";
import { lojaAsaasCfg } from "@/lib/loja/cobranca";
import { getDb } from "@/lib/loja/db";
import { cancelar, criarPedido, ErroLoja, type EntradaPedido, type ItemEntrada } from "@/lib/loja/pedidos";
import { dispararCiclo } from "@/lib/loja/verificador";

export const runtime = "nodejs";

const FORMAS = new Set(["pix", "cartao1", "cartao2"]);
const MAX_LINHAS = 30;

function lerItens(valor: unknown): ItemEntrada[] | null {
  if (!Array.isArray(valor) || valor.length === 0 || valor.length > MAX_LINHAS) return null;
  const itens: ItemEntrada[] = [];
  for (const i of valor) {
    if (!i || typeof i !== "object") return null;
    const { variacaoId, qtd } = i as Record<string, unknown>;
    if (!Number.isInteger(variacaoId) || !Number.isInteger(qtd)) return null;
    itens.push({ variacaoId: variacaoId as number, qtd: qtd as number });
  }
  return itens;
}

export async function POST(request: Request) {
  const lido = await lerJson(request);
  if (!lido.ok) return lido.resposta;
  const body = lido.corpo;

  // Campo escondido: só robô preenche.
  if (typeof body.site === "string" && body.site.trim()) {
    return NextResponse.json({ ok: true });
  }

  const nome = typeof body.nome === "string" ? body.nome.trim().replace(/\s+/g, " ") : "";
  const whatsapp = typeof body.whatsapp === "string" ? normalizeWhatsapp(body.whatsapp) : null;
  const cpf = typeof body.cpf === "string" ? body.cpf : "";
  const forma = typeof body.forma === "string" && FORMAS.has(body.forma) ? (body.forma as EntradaPedido["forma"]) : null;
  const itens = lerItens(body.itens);

  if (nome.length < 2 || nome.length > 80) return erro("Escreve seu nome.", 400);
  if (!whatsapp) return erro("Confere o WhatsApp com DDD.", 400);
  if (!isValidCpf(cpf)) return erro("Confere o CPF. Ele é pedido só para gerar o pagamento.", 400);
  if (!forma) return erro("Escolhe como vai pagar.", 400);
  if (!itens) return erro("Confere o carrinho e tenta de novo.", 400);

  if (!lojaAsaasCfg()) {
    console.error("loja: LOJA_ASAAS_API_KEY não configurada");
    return erro("A loja está fora do ar agora. Tenta mais tarde.", 503);
  }

  const db = getDb();
  let pedido;
  try {
    pedido = criarPedido(db, { nome, whatsapp, aceitaMsgs: body.aceitaMsgs === true, forma, itens }, new Date());
  } catch (e) {
    if (e instanceof ErroLoja) return erroLoja(e);
    console.error("loja: falha ao criar pedido", paraLog(e));
    return erro("Não deu pra salvar agora. Tenta de novo.", 500);
  }

  try {
    await cobrar(db, pedido, cpf);
  } catch (e) {
    console.error(`loja: falha ao gerar cobrança do pedido ${pedido.id}`, paraLog(e));
    try {
      cancelar(db, pedido.id); // devolve o estoque
    } catch (e2) {
      console.error(`loja: falha ao cancelar o pedido ${pedido.id}`, paraLog(e2));
    }
    return erro(ERRO_PAGAMENTO, 502);
  }

  dispararCiclo(); // mensagem "recebido" sai na hora
  return NextResponse.json({ codigo: pedido.codigo });
}
