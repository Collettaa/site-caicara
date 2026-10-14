// Cobrança da loja no Asaas. Conta própria: só LOJA_ASAAS_URL / LOJA_ASAAS_API_KEY.
// CPF só passa por aqui a caminho do Asaas: não é gravado nem vai para log.

import { ASAAS_URL_PADRAO, asaasFetch, ErroAsaas, type AsaasCfg } from "@/lib/asaas";
import type { DadosCobranca } from "@/lib/loja/pedidos";
import type { ItemPedido, Pedido } from "@/lib/loja/tipos";

export function lojaAsaasCfg(): AsaasCfg | null {
  const apiKey = process.env.LOJA_ASAAS_API_KEY;
  if (!apiKey) return null;
  return { url: process.env.LOJA_ASAAS_URL || ASAAS_URL_PADRAO, apiKey };
}

function cfgObrigatoria(): AsaasCfg {
  const cfg = lojaAsaasCfg();
  if (!cfg) throw new Error("loja: LOJA_ASAAS_API_KEY não configurada");
  return cfg;
}

const reais = (centavos: number) => centavos / 100;
const centavos = (valor: number) => Math.round(valor * 100);

function hojeEmSaoPaulo(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}

function descricao(pedido: Pedido & { itens?: ItemPedido[] }): string {
  const itens = (pedido.itens ?? []).map((i) => `${i.qtd}x ${i.descricao}`).join(", ");
  const texto = `Caiçara Fit · pedido ${pedido.codigo}${itens ? ` · ${itens}` : ""}`;
  return texto.length > 500 ? `${texto.slice(0, 497)}...` : texto;
}

// Tira o CPF (com ou sem máscara) de mensagens de erro que o Asaas possa ecoar.
function semCpf(erro: unknown, cpf: string, cpfDigitos: string): Error {
  const limpar = (s: string) => s.split(cpf).join("***").split(cpfDigitos).join("***");
  const msg = erro instanceof Error ? erro.message : String(erro);
  const limpo = erro instanceof ErroAsaas ? new ErroAsaas(limpar(msg), erro.status) : new Error(limpar(msg));
  limpo.stack = `${limpo.name}: ${limpo.message}`;
  return limpo;
}

export type Cobranca = DadosCobranca;

export async function criarCobranca(
  pedido: Pedido & { itens?: ItemPedido[] },
  cliente: { nome: string; cpf: string; whatsapp: string },
): Promise<Cobranca> {
  const cfg = cfgObrigatoria();
  const cpfDigitos = cliente.cpf.replace(/\D/g, "");

  let customerId: string;
  try {
    const customer = await asaasFetch<{ id: string }>(cfg, "/customers", {
      method: "POST",
      body: JSON.stringify({
        name: cliente.nome,
        cpfCnpj: cpfDigitos,
        mobilePhone: cliente.whatsapp.slice(2),
        notificationDisabled: true,
      }),
    });
    customerId = customer.id;
  } catch (erro) {
    throw semCpf(erro, cliente.cpf, cpfDigitos);
  }

  const base = {
    customer: customerId,
    dueDate: hojeEmSaoPaulo(),
    description: descricao(pedido),
    externalReference: `loja:${pedido.codigo}`,
    callback: {
      successUrl: `${process.env.SITE_URL ?? ""}/loja/pedido/${pedido.codigo}`,
      autoRedirect: true,
    },
  };

  let corpo: Record<string, unknown>;
  if (pedido.forma === "pix") corpo = { ...base, billingType: "PIX", value: reais(pedido.total) };
  else if (pedido.forma === "cartao1") corpo = { ...base, billingType: "CREDIT_CARD", value: reais(pedido.total) };
  else if (pedido.forma === "cartao2")
    corpo = { ...base, billingType: "CREDIT_CARD", installmentCount: 2, totalValue: reais(pedido.total) };
  else throw new Error(`loja: forma ${pedido.forma} não gera cobrança no Asaas`);

  const payment = await asaasFetch<{ id: string; invoiceUrl: string; installment?: string | null }>(cfg, "/payments", {
    method: "POST",
    body: JSON.stringify(corpo),
  });

  const cobranca: Cobranca = { asaasId: payment.id, invoiceUrl: payment.invoiceUrl };
  if (pedido.forma === "cartao2" && payment.installment) cobranca.parcelamentoId = payment.installment;

  if (pedido.forma === "pix") {
    const pix = await asaasFetch<{ encodedImage: string; payload: string }>(cfg, `/payments/${payment.id}/pixQrCode`);
    cobranca.pixQr = pix.encodedImage;
    cobranca.pixCopiaCola = pix.payload;
  }

  return cobranca;
}

const STATUS_PAGO = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

type Pagamento = { status: string; netValue?: number | null };

export async function consultarPagamento(p: Pedido): Promise<{ pago: boolean; liquido: number | null }> {
  const cfg = cfgObrigatoria();

  if (p.asaasParcelamentoId) {
    const lista = await asaasFetch<{ data: Pagamento[] }>(
      cfg,
      `/payments?installment=${encodeURIComponent(p.asaasParcelamentoId)}`,
    );
    const parcelas = lista.data ?? [];
    const pago = parcelas.length > 0 && parcelas.every((x) => STATUS_PAGO.has(x.status));
    if (!pago) return { pago: false, liquido: null };
    return { pago: true, liquido: parcelas.reduce((soma, x) => soma + centavos(x.netValue ?? 0), 0) };
  }

  if (!p.asaasId) return { pago: false, liquido: null };
  const pagamento = await asaasFetch<Pagamento>(cfg, `/payments/${encodeURIComponent(p.asaasId)}`);
  if (!STATUS_PAGO.has(pagamento.status)) return { pago: false, liquido: null };
  return { pago: true, liquido: typeof pagamento.netValue === "number" ? centavos(pagamento.netValue) : null };
}

export async function cancelarCobranca(p: Pedido): Promise<void> {
  const caminho = p.asaasParcelamentoId
    ? `/installments/${encodeURIComponent(p.asaasParcelamentoId)}`
    : p.asaasId
      ? `/payments/${encodeURIComponent(p.asaasId)}`
      : null;
  if (!caminho) return;

  try {
    await asaasFetch(cfgObrigatoria(), caminho, { method: "DELETE" });
  } catch (erro) {
    if (erro instanceof ErroAsaas && erro.status === 404) return;
    throw erro;
  }
}
