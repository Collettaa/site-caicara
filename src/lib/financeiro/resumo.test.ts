import { describe, expect, it } from "vitest";
import { type Cobranca, type Movimento, acumulado, financeiroCsv, montarResumo, origemDe } from "@/lib/financeiro/resumo";

describe("origemDe", () => {
  it.each([
    [{ externalReference: "loja:abc" }, "loja"],
    [{ externalReference: "aulao-rosa:5513" }, "eventos"],
    [{ externalReference: "inscricao-123", description: "Inscricao feminina - Treino Hibrido" }, "hybrid"],
    [{ externalReference: "rxn1|box" }, "mensalidades"],
    [{ subscription: "sub_1" }, "mensalidades"],
    [{ description: "Parcela 3 de 12. Plano Anual Caiçara" }, "mensalidades"],
    [{ description: "Cobrança gerada automaticamente a partir de Pix recebido" }, "pix_direto"],
    [{ description: "cinto Vortex" }, "outros"],
  ])("%j → %s", (c, origem) => {
    expect(origemDe(c)).toBe(origem);
  });
});

const base = { customer: "c1", billingType: "PIX", dueDate: "2026-10-10" };
const nomes = new Map([["c1", "Ana"], ["c2", "Bruno"]]);

describe("montarResumo", () => {
  const cobrancas: Cobranca[] = [
    { ...base, id: "p1", status: "RECEIVED", value: 170, clientPaymentDate: "2026-10-05", externalReference: "rxn1|box" },
    // cartão 3x: uma linha só, valor cheio no dia da compra, dinheiro cai depois
    ...[1, 2, 3].map((n) => ({
      ...base, id: `c${n}`, customer: "c2", status: "CONFIRMED", billingType: "CREDIT_CARD", value: 100,
      clientPaymentDate: "2026-10-08", creditDate: `2026-1${n}-08`, installment: "inst1",
      description: `Parcela ${n} de 3. Plano trimestral`,
    })),
    { ...base, id: "p2", status: "RECEIVED", value: 65, clientPaymentDate: "2026-09-30", externalReference: "loja:x" },
    { ...base, id: "a1", status: "PENDING", value: 170, dueDate: "2026-10-20", externalReference: "rxn1|box" },
    { ...base, id: "a2", status: "PENDING", value: 170, dueDate: "2026-10-12", externalReference: "rxn1|box" },
    { ...base, id: "a3", status: "OVERDUE", value: 15, dueDate: "2026-10-01", externalReference: "aulao-rosa:1" },
  ];
  const extrato: Movimento[] = [
    { id: "t1", type: "PAYMENT_RECEIVED", value: 170, date: "2026-10-05" },
    { id: "t2", type: "PAYMENT_FEE", value: -1.99, date: "2026-10-05" },
    { id: "t3", type: "RECEIVABLE_ANTICIPATION_GROSS_CREDIT", value: 290, date: "2026-10-09" },
    { id: "t4", type: "RECEIVABLE_ANTICIPATION_FEE", value: -10, date: "2026-10-09" },
    { id: "t5", type: "TRANSFER", value: -400, date: "2026-10-10" },
    { id: "t6", type: "PAYMENT_RECEIVED", value: 65, date: "2026-09-30" },
  ];
  const r = montarResumo("2026-10", "2026-10-16", cobrancas, extrato, nomes);

  it("pago no mês por origem, parcelas juntas", () => {
    expect(r.pago).toBe(470);
    expect(r.pagoPorOrigem.mensalidades).toBe(470);
    expect(r.pagoPorOrigem.loja).toBe(0);
    const cartao = r.pagamentos.find((p) => p.parcelas === 3)!;
    expect(cartao).toMatchObject({ cliente: "Bruno", valor: 300, descricao: "Plano trimestral", caiEm: "2026-11-08" });
  });

  it("extrato do mês: caiu, antecipação, taxas e transferência", () => {
    expect(r.caiuNaConta).toBe(170);
    expect(r.antecipacaoLiquida).toBe(290);
    expect(r.taxas).toBe(1.99);
    expect(r.taxaAntecipacao).toBe(10);
    expect(r.transferencias).toBe(400);
  });

  it("vencido e a receber calculados na hora pelo vencimento", () => {
    expect(r.vencidos.map((v) => v.valor)).toEqual([15, 170]); // OVERDUE e PENDING que já passou
    expect(r.aReceber).toHaveLength(1);
    expect(r.aReceber[0]).toMatchObject({ vencimento: "2026-10-20", cliente: "Ana" });
  });

  it("por dia: 31 dias, total e origem no dia certo, acumulado", () => {
    expect(r.porDia).toHaveLength(31);
    expect(r.porDia[4]).toMatchObject({ dia: "2026-10-05", total: 170 });
    expect(r.porDia[7].porOrigem.mensalidades).toBe(300);
    const ac = acumulado(r.porDia);
    expect(ac[6]).toBe(170);
    expect(ac[30]).toBe(470);
  });

  it("csv com uma linha por compra", () => {
    const csv = financeiroCsv(r);
    expect(csv.trim().split("\n")).toHaveLength(3);
    expect(csv).toContain("Bruno;Plano trimestral;Mensalidades e planos;Cartão;3;300,00;2026-11-08");
  });
});
