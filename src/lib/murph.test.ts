import { describe, expect, it } from "vitest";
import { bateriaLabel, bateriasLivres, contarTamanhos, devePagar, juntarInscricoes, murph, ocupacao, type InscricaoMurph } from "@/lib/murph";

const pessoa = (n: number, extra: Partial<InscricaoMurph> = {}): InscricaoMurph => ({
  nome: `P${n}`,
  whatsapp: `55139999${String(n).padStart(5, "0")}`,
  vinculo: "aluno",
  bateria: "06:00",
  versao: "completo",
  camiseta: false,
  criadoEm: "2026-11-08T21:00:00Z",
  ...extra,
});

describe("murph", () => {
  it("rótulo da bateria", () => {
    expect(bateriaLabel("06:00")).toBe("6h");
    expect(bateriaLabel("18:30")).toBe("18h30");
    expect(bateriaLabel("20:00")).toBe("20h");
  });

  it("bateria lotada some da lista, mas quem já está nela pode se reinscrever", () => {
    const cheia = Array.from({ length: murph.vagasPorBateria }, (_, n) => pessoa(n));
    expect(bateriasLivres(cheia)).not.toContain("06:00");
    expect(bateriasLivres(cheia, cheia[0].whatsapp)).toContain("06:00");
  });

  it("troca de bateria libera a vaga antiga e mantém check-in e pagamento", () => {
    const a = pessoa(1);
    const raw = [a, { ajuste: a.whatsapp, pago: true }, { ...a, bateria: "20:00" }].map((o) => JSON.stringify(o)).join("\n");
    const lista = juntarInscricoes(raw);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ bateria: "20:00", pago: true });
    expect(ocupacao(lista)["06:00"]).toBe(0);
  });

  it("conta camiseta por tamanho e separa inscrição antiga sem tamanho", () => {
    const lista = [
      pessoa(1, { camiseta: true, tamanho: "M" }),
      pessoa(2, { camiseta: true, tamanho: "M" }),
      pessoa(3, { camiseta: true, tamanho: "GG" }),
      pessoa(4, { camiseta: true }),
      pessoa(5),
    ];
    expect(contarTamanhos(lista)).toEqual({ porTamanho: { P: 0, M: 2, G: 0, GG: 1 }, semTamanho: 1 });
  });

  it("só de fora ou quem pede camiseta tem algo a acertar", () => {
    expect(devePagar({ vinculo: "aluno", camiseta: false })).toBe(false);
    expect(devePagar({ vinculo: "totalpass", camiseta: true })).toBe(true);
    expect(devePagar({ vinculo: "fora", camiseta: false })).toBe(true);
  });
});

describe("murph: Pix de quem é de fora", () => {
  it("de fora sem camiseta deve até o Pix ser confirmado; com camiseta deve a camiseta", () => {
    expect(devePagar({ vinculo: "fora", camiseta: false })).toBe(true);
    expect(devePagar({ vinculo: "fora", camiseta: false, pixPago: true })).toBe(false);
    expect(devePagar({ vinculo: "fora", camiseta: true, pixPago: true })).toBe(true);
    expect(devePagar({ vinculo: "aluno", camiseta: false })).toBe(false);
  });

  it("reinscrição mantém o Pix já pago", () => {
    const base = { nome: "Ana", whatsapp: "5513999990000", vinculo: "fora", versao: "meio", camiseta: false, criadoEm: "x" };
    const raw = [
      JSON.stringify({ ...base, bateria: "06:00", pagamentoId: "pay_1" }),
      JSON.stringify({ ajuste: "5513999990000", pixPago: true }),
      JSON.stringify({ ...base, bateria: "08:00" }),
    ].join("\n");
    const [ana] = juntarInscricoes(raw);
    expect(ana.bateria).toBe("08:00");
    expect(ana.pixPago).toBe(true);
    expect(ana.pagamentoId).toBe("pay_1");
  });
});
