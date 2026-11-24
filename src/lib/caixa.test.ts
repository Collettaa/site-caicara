import { describe, expect, it } from "vitest";
import {
  type Conta,
  type Lancamento,
  type Parcelado,
  contasDoMes,
  livroDoMes,
  porPessoa,
  situacaoParcelado,
  somaLivro,
  totaisContas,
  valorDaParcela,
  valorValido,
  vencimentoParcela,
} from "@/lib/caixa";

const conta = (x: Partial<Conta>): Conta => ({ id: "c1", nome: "Maria", valor: 800, dia: 5, grupo: "equipe", desde: "2026-11", ...x });
const lanc = (x: Partial<Lancamento>): Lancamento => ({
  id: "l1", data: "2026-11-05", tipo: "saida", valor: 800, descricao: "Maria", forma: "pix", criadoEm: "2026-11-05T12:00:00Z", ...x,
});

describe("valorValido", () => {
  it.each([["170", 170], ["170,50", 170.5], ["1.200,00", 1200], ["R$ 45", 45], ["12.5", 12.5], ["0", null], ["abc", null], ["", null]])(
    "%s → %s",
    (v, n) => expect(valorValido(v)).toBe(n),
  );
});

describe("contasDoMes", () => {
  it("paga, atrasada, hoje e aberta calculadas na hora", () => {
    const contas = [conta({}), conta({ id: "c2", nome: "Grazy", dia: 10 }), conta({ id: "c3", nome: "Aluguel", dia: 23, grupo: "casa" }), conta({ id: "c4", nome: "Luz", dia: 28 })];
    const itens = contasDoMes({ contas, lancamentos: [lanc({ contaId: "c1", mesConta: "2026-11", valor: 750 })] }, "2026-11", "2026-11-23");
    expect(itens.map((i) => [i.conta.nome, i.situacao])).toEqual([["Maria", "paga"], ["Grazy", "atrasada"], ["Aluguel", "hoje"], ["Luz", "aberta"]]);
    // pago com valor diferente conta o que pagou
    expect(totaisContas(itens)).toEqual({ total: 750 + 800 * 3, pago: 750, falta: 2400, atrasadas: 1 });
  });

  it("dia 31 em mês de 30 vence dia 30; avulsa só no mês; encerrada some", () => {
    const contas = [conta({ dia: 31 }), conta({ id: "u", nome: "Conserto", unica: true, desde: "2026-10" }), conta({ id: "e", nome: "Velha", desde: "2026-01", ate: "2026-10" })];
    const itens = contasDoMes({ contas, lancamentos: [] }, "2026-11", "2026-11-01");
    expect(itens.map((i) => [i.conta.nome, i.vence])).toEqual([["Maria", "2026-11-30"]]);
  });
});

describe("livroDoMes", () => {
  it("junta Asaas e balcão por dia; TotalPass fica de fora do acumulado", () => {
    const asaas = {
      porDia: new Map([["2026-11-02", [{ cliente: "Ana", descricao: "Plano mensal", origem: "Mensalidades", forma: "Pix", valor: 170, parcelas: 1 }]]]),
      taxasPorDia: new Map([["2026-11-02", 1.99]]),
    };
    const lancs = [lanc({ data: "2026-11-01", tipo: "entrada", valor: 15, descricao: "avulsa", forma: "dinheiro" }), lanc({ data: "2026-11-03" })];
    const dias = livroDoMes("2026-11", "2026-11-03", lancs, asaas, { porDia: [2, 1, 0], repasse: [32.14, 16.07, 0] });
    expect(dias).toHaveLength(3);
    expect(dias.map((d) => [d.entrou, d.saiu, d.acumulado])).toEqual([[15, 0, 15], [170, 1.99, 183.01], [0, 800, -616.99]]);
    expect(somaLivro(dias)).toMatchObject({ asaas: 170, balcao: 15, totalpass: 48.21, checkins: 3, resultado: -616.99 });
  });

  it("mês futuro não tem dia", () => {
    expect(livroDoMes("2026-12", "2026-11-23", [], null, null)).toEqual([]);
  });
});

describe("parcelados", () => {
  const p: Parcelado = {
    id: "p", pessoa: "André", descricao: "Caixa de som", total: 400, parcelas: 12, dia: 10, inicio: "2026-11", pagas: [], criadoEm: "",
  };

  it("400 em 12×: 11 de 33,33 e a última de 33,37", () => {
    expect(valorDaParcela(p, 1)).toBe(33.33);
    expect(valorDaParcela(p, 12)).toBe(33.37);
  });

  it("próxima avança do vencimento anterior, não da data em que pagou", () => {
    const pagou = { ...p, pagas: [{ n: 1, data: "2026-11-25", valor: 33.33 }] };
    const s = situacaoParcelado(pagou, "2026-11-25");
    expect(s.proxima).toEqual({ n: 2, vence: "2026-12-10", valor: 33.33, atrasada: false });
    expect(s).toMatchObject({ pago: 33.33, falta: 366.67, pagas: 1, quitado: false });
    expect(vencimentoParcela(p, 3)).toBe("2027-01-10");
  });

  it("atrasada e quitada", () => {
    expect(situacaoParcelado(p, "2026-11-11").proxima?.atrasada).toBe(true);
    const tudo = { ...p, pagas: Array.from({ length: 12 }, (_, i) => ({ n: i + 1, data: "2026-11-10", valor: valorDaParcela(p, i + 1) })) };
    expect(situacaoParcelado(tudo, "2027-12-01")).toMatchObject({ quitado: true, falta: 0, proxima: null, pago: 400 });
  });

  it("soma por pessoa", () => {
    const outro = { ...p, id: "q", descricao: "Ventilador", total: 300, parcelas: 3, pagas: [{ n: 1, data: "2026-11-10", valor: 100 }] };
    const [andre] = porPessoa([situacaoParcelado(p, "2026-11-01"), situacaoParcelado({ ...outro, pessoa: "andré" }, "2026-11-01")]);
    expect(andre).toMatchObject({ pessoa: "André", total: 700, pago: 100, falta: 600 });
  });
});
