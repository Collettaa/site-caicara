// Financeiro do admin: lê cobranças e extrato do Asaas e monta o mês.
// Só leitura. Mostra o que passa pelo Asaas — dinheiro e maquininha do balcão ficam fora
// (o caixa oficial é o app; não somar os dois).

export type Origem = "mensalidades" | "hybrid" | "eventos" | "loja" | "pix_direto" | "outros";

export const NOME_ORIGEM: Record<Origem, string> = {
  mensalidades: "Mensalidades e planos",
  hybrid: "Hybrid WOD",
  eventos: "Eventos",
  loja: "Loja",
  pix_direto: "Pix direto",
  outros: "Outros",
};

export const ORDEM_ORIGEM = Object.keys(NOME_ORIGEM) as Origem[];

export type Cobranca = {
  id: string;
  customer: string;
  status: string;
  billingType: string;
  value: number;
  netValue?: number;
  dueDate: string;
  clientPaymentDate?: string | null;
  creditDate?: string | null;
  description?: string | null;
  externalReference?: string | null;
  subscription?: string | null;
  installment?: string | null;
};

export type Movimento = {
  id: string;
  type: string;
  value: number;
  date: string;
  description?: string | null;
  paymentId?: string | null;
};

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** De onde veio a cobrança — pelo que já vem escrito nela (levantamento de 16/10/2026). */
export function origemDe(c: Pick<Cobranca, "externalReference" | "description" | "subscription">): Origem {
  const ref = semAcento(c.externalReference ?? "");
  const desc = semAcento(c.description ?? "");
  if (ref.startsWith("loja")) return "loja";
  if (ref.startsWith("aulao-rosa") || ref.startsWith("evento")) return "eventos";
  if (ref.startsWith("inscricao") || desc.includes("hibrid")) return "hybrid";
  if (c.subscription || ref.startsWith("rxn1") || /mensal|plano/.test(desc)) return "mensalidades";
  if (desc.startsWith("cobranca gerada automaticamente")) return "pix_direto";
  return "outros";
}

const PAGO = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

const FORMA: Record<string, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão",
  BOLETO: "Boleto",
  DEBIT_CARD: "Débito",
  UNDEFINED: "Em dinheiro",
};

export type Pagamento = {
  data: string;
  cliente: string;
  descricao: string;
  origem: Origem;
  forma: string;
  valor: number;
  parcelas: number;
  caiEm: string | null; // cartão: quando o dinheiro chega (sem antecipação)
};

export type Aberto = { vencimento: string; cliente: string; descricao: string; origem: Origem; valor: number };

export type Dia = { dia: string; total: number; porOrigem: Record<Origem, number> };

export type ResumoMes = {
  mes: string;
  /** Um item por dia do mês, de 1 até o último (dia sem pagamento = 0). */
  porDia: Dia[];
  pagoPorOrigem: Record<Origem, number>;
  pago: number;
  pagamentos: Pagamento[];
  caiuNaConta: number;
  antecipacaoLiquida: number;
  taxas: number;
  taxaAntecipacao: number;
  transferencias: number;
  aReceber: Aberto[];
  vencidos: Aberto[];
};

const dentro = (data: string | null | undefined, mes: string) => Boolean(data && data.startsWith(mes));
const centavos = (v: number) => Math.round(v * 100) / 100;

/**
 * mes = "AAAA-MM"; hoje = "AAAA-MM-DD".
 * "Pago" = o cliente pagou no mês (cartão parcelado conta inteiro no dia da compra).
 * "Caiu na conta" = o que o extrato mostra entrando no mês, já com antecipação.
 * A receber e vencido são calculados na hora pelo vencimento — nunca gravados.
 */
export function montarResumo(
  mes: string,
  hoje: string,
  cobrancas: Cobranca[],
  extrato: Movimento[],
  nomes: Map<string, string>,
): ResumoMes {
  const pagoPorOrigem = Object.fromEntries(ORDEM_ORIGEM.map((o) => [o, 0])) as Record<Origem, number>;
  const porCompra = new Map<string, Pagamento>(); // parcelas da mesma compra viram uma linha

  for (const c of cobrancas) {
    if (!PAGO.has(c.status) || !dentro(c.clientPaymentDate, mes)) continue;
    const origem = origemDe(c);
    pagoPorOrigem[origem] = centavos(pagoPorOrigem[origem] + c.value);
    const chave = c.installment ? `parc:${c.installment}` : c.id;
    const atual = porCompra.get(chave);
    if (atual) {
      atual.valor = centavos(atual.valor + c.value);
      atual.parcelas += 1;
      continue;
    }
    porCompra.set(chave, {
      data: c.clientPaymentDate!,
      cliente: nomes.get(c.customer) ?? "—",
      descricao: (c.description ?? "").replace(/^Parcela \d+ de \d+\.\s*/, ""),
      origem,
      forma: FORMA[c.billingType] ?? c.billingType,
      valor: c.value,
      parcelas: 1,
      caiEm: c.billingType === "CREDIT_CARD" && c.creditDate && c.creditDate > hoje ? c.creditDate : null,
    });
  }

  const soma = (tipos: string[]) =>
    centavos(extrato.filter((m) => tipos.includes(m.type) && dentro(m.date, mes)).reduce((t, m) => t + m.value, 0));

  const aberto = (c: Cobranca): Aberto => ({
    vencimento: c.dueDate,
    cliente: nomes.get(c.customer) ?? "—",
    descricao: c.description ?? "",
    origem: origemDe(c),
    valor: c.value,
  });
  // Atrasado = venceu e não pagou, calculado agora (status do Asaas pode estar 1 dia atrás).
  const naoPago = cobrancas.filter((c) => c.status === "PENDING" || c.status === "OVERDUE");
  const vencidos = naoPago.filter((c) => c.dueDate < hoje).map(aberto).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  const aReceber = naoPago
    .filter((c) => c.dueDate >= hoje && dentro(c.dueDate, mes))
    .map(aberto)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  const [ano, numMes] = mes.split("-").map(Number);
  const diasNoMes = new Date(Date.UTC(ano, numMes, 0)).getUTCDate();
  const porDia: Dia[] = Array.from({ length: diasNoMes }, (_, n) => ({
    dia: `${mes}-${String(n + 1).padStart(2, "0")}`,
    total: 0,
    porOrigem: Object.fromEntries(ORDEM_ORIGEM.map((o) => [o, 0])) as Record<Origem, number>,
  }));
  for (const c of cobrancas) {
    if (!PAGO.has(c.status) || !dentro(c.clientPaymentDate, mes)) continue;
    const d = porDia[Number(c.clientPaymentDate!.slice(8, 10)) - 1];
    const o = origemDe(c);
    d.porOrigem[o] = centavos(d.porOrigem[o] + c.value);
    d.total = centavos(d.total + c.value);
  }

  return {
    mes,
    porDia,
    pagoPorOrigem,
    pago: centavos(Object.values(pagoPorOrigem).reduce((t, v) => t + v, 0)),
    pagamentos: [...porCompra.values()].sort((a, b) => b.data.localeCompare(a.data)),
    caiuNaConta: soma(["PAYMENT_RECEIVED"]),
    antecipacaoLiquida: soma(["RECEIVABLE_ANTICIPATION_GROSS_CREDIT", "RECEIVABLE_ANTICIPATION_DEBIT"]),
    taxas: -soma(["PAYMENT_FEE", "PAYMENT_MESSAGING_NOTIFICATION_FEE", "INSTANT_TEXT_MESSAGE_FEE", "PAYMENT_DUNNING_REQUEST_FEE"]),
    taxaAntecipacao: -soma(["RECEIVABLE_ANTICIPATION_FEE"]),
    transferencias: -soma(["TRANSFER"]),
    aReceber,
    vencidos,
  };
}

/** CSV do mês para o fechar-mes (separador ;, decimal com vírgula, abre direto no Excel/Sheets). */
export function financeiroCsv(r: ResumoMes): string {
  const num = (v: number) => v.toFixed(2).replace(".", ",");
  const esc = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const linhas = [["data", "cliente", "descricao", "origem", "forma", "parcelas", "valor", "cai_em"].join(";")];
  for (const p of r.pagamentos) {
    linhas.push(
      [p.data, esc(p.cliente), esc(p.descricao), NOME_ORIGEM[p.origem], p.forma, String(p.parcelas), num(p.valor), p.caiEm ?? ""].join(";"),
    );
  }
  return `﻿${linhas.join("\n")}\n`;
}

/** Soma corrida dia a dia (1º → último); serve para comparar com o mês anterior no mesmo dia. */
export function acumulado(porDia: Dia[]): number[] {
  let t = 0;
  return porDia.map((d) => (t = centavos(t + d.total)));
}

/** CSV por dia (marketing): um dia por linha, total e cada origem — cruza com post e anúncio. */
export function financeiroDiasCsv(r: ResumoMes): string {
  const num = (v: number) => v.toFixed(2).replace(".", ",");
  const semana = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  const linhas = [["data", "dia_semana", "total", ...ORDEM_ORIGEM].join(";")];
  for (const d of r.porDia) {
    const ds = semana[new Date(`${d.dia}T12:00:00Z`).getUTCDay()];
    linhas.push([d.dia, ds, num(d.total), ...ORDEM_ORIGEM.map((o) => num(d.porOrigem[o]))].join(";"));
  }
  return `\uFEFF${linhas.join("\n")}\n`;
}
