import { describe, expect, it } from "vitest";
import { bateriaLabel, bateriasLivres, devePagar, juntarInscricoes, murph, ocupacao, type InscricaoMurph } from "@/lib/murph";

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

  it("só de fora ou quem pede camiseta tem algo a acertar", () => {
    expect(devePagar({ vinculo: "aluno", camiseta: false })).toBe(false);
    expect(devePagar({ vinculo: "totalpass", camiseta: true })).toBe(true);
    expect(devePagar({ vinculo: "fora", camiseta: false })).toBe(true);
  });
});
