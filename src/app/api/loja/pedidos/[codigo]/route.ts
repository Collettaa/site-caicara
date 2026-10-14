import { NextResponse } from "next/server";
import { isValidCpf } from "@/lib/contato";
import {
  barreira,
  CODIGO_VALIDO,
  cobrar,
  ERRO_PAGAMENTO,
  erro,
  erroLoja,
  lerJson,
  paraLog,
  podeConsultar,
} from "@/lib/loja/api";
import { cancelarCobranca, consultarPagamento } from "@/lib/loja/cobranca";
import { getDb } from "@/lib/loja/db";
import {
  buscarPorCodigo,
  ErroLoja,
  marcarPago,
  reativar,
  voltarParaExpirado,
  type PedidoComItens,
} from "@/lib/loja/pedidos";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ codigo: string }> };

const NAO_ACHEI = "Pedido não encontrado.";

/** Só o que a tela do pedido precisa. Nada de nome, WhatsApp, CPF ou ids do Asaas. */
function paraTela(p: PedidoComItens) {
  const aguardando = p.status === "aguardando";
  return {
    status: p.status,
    total: p.total,
    forma: p.forma,
    itens: p.itens.map((i) => ({ descricao: i.descricao, qtd: i.qtd, precoUnit: i.precoUnit })),
    pixQr: aguardando ? p.pixQr : null,
    pixCopiaCola: aguardando ? p.pixCopiaCola : null,
    invoiceUrl: aguardando ? p.invoiceUrl : null,
    reservadoAte: aguardando ? p.reservadoAte : null,
  };
}

export async function GET(_request: Request, { params }: Contexto) {
  const { codigo } = await params;
  if (!CODIGO_VALIDO.test(codigo)) return erro(NAO_ACHEI, 404);
  const db = getDb();
  let pedido = buscarPorCodigo(db, codigo);
  if (!pedido) return erro(NAO_ACHEI, 404);

  // Pix pago agora: não espera o webhook nem o verificador. No máximo 1 consulta a cada 20 s por código.
  if (pedido.status === "aguardando" && pedido.asaasId && podeConsultar(codigo)) {
    try {
      const r = await consultarPagamento(pedido);
      if (r.pago) {
        marcarPago(db, codigo, r.liquido, new Date());
        pedido = buscarPorCodigo(db, codigo) ?? pedido;
      }
    } catch (e) {
      console.error(`loja: consultar pagamento do pedido ${pedido.id} falhou`, paraLog(e));
    }
  }

  return NextResponse.json(paraTela(pedido), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, { params }: Contexto) {
  const { codigo } = await params;
  if (!CODIGO_VALIDO.test(codigo)) return erro(NAO_ACHEI, 404);

  const lido = await lerJson(request);
  if (!lido.ok) return lido.resposta;
  const { acao, cpf } = lido.corpo;
  if (acao !== "reativar") return erro("Ação inválida.", 400);
  if (typeof cpf !== "string" || !isValidCpf(cpf)) {
    return erro("Confere o CPF. Ele é pedido só para gerar o pagamento.", 400);
  }

  const db = getDb();
  const atual = buscarPorCodigo(db, codigo);
  if (!atual) return erro(NAO_ACHEI, 404);
  if (atual.status !== "expirado") return erroLoja(new ErroLoja("status", "Esse pedido não está vencido."));

  const bloqueio = barreira(db, request, atual.whatsapp);
  if (bloqueio) return bloqueio;

  // Cobrança antiga: cancela antes de gerar outra (já removida no Asaas conta como cancelada). Não deu pra cancelar →
  // confere se foi paga; pago → marca pago; senão 502 sem cobrança nova.
  if (atual.asaasId || atual.asaasParcelamentoId) {
    try {
      await cancelarCobranca(atual);
    } catch (e) {
      console.error(`loja: cancelar cobrança antiga do pedido ${atual.id} falhou`, paraLog(e));
      try {
        const r = await consultarPagamento(atual);
        if (r.pago) {
          marcarPago(db, codigo, r.liquido, new Date());
          return NextResponse.json({ codigo });
        }
      } catch (e2) {
        console.error(`loja: consultar cobrança antiga do pedido ${atual.id} falhou`, paraLog(e2));
      }
      // Antiga continua aberta: nunca duas cobranças abertas para o mesmo pedido.
      return erro(ERRO_PAGAMENTO, 502);
    }
  }

  let pedido: PedidoComItens;
  try {
    reativar(db, codigo, new Date());
    pedido = buscarPorCodigo(db, codigo)!;
  } catch (e) {
    if (e instanceof ErroLoja) return erroLoja(e);
    console.error("loja: falha ao reativar pedido", paraLog(e));
    return erro("Não deu pra salvar agora. Tenta de novo.", 500);
  }

  try {
    await cobrar(db, pedido, cpf);
  } catch (e) {
    console.error(`loja: falha ao gerar cobrança do pedido ${pedido.id}`, paraLog(e));
    try {
      voltarParaExpirado(db, pedido.id); // devolve a peça
    } catch (e2) {
      console.error(`loja: falha ao desfazer reativação do pedido ${pedido.id}`, paraLog(e2));
    }
    return erro(ERRO_PAGAMENTO, 502);
  }

  return NextResponse.json({ codigo });
}
