import { describe, expect, it } from "vitest";
import { agrupar, hojeSP, limparPrazo, montarAviso, somarDias, type Pendencia } from "./pendencias";

const item = (texto: string, prazo?: string, feitaEm?: string): Pendencia => ({
  id: texto,
  texto,
  criadaEm: "2026-11-01T10:00:00.000Z",
  ...(prazo ? { prazo } : {}),
  ...(feitaEm ? { feitaEm } : {}),
});

const LINK = "https://caicara.store/admin/pendencias";

describe("pendências", () => {
  it("usa o dia de São Paulo, não o de UTC", () => {
    expect(hojeSP(new Date("2026-11-09T02:30:00Z"))).toBe("2026-11-08");
    expect(hojeSP(new Date("2026-11-09T03:00:00Z"))).toBe("2026-11-09");
  });

  it("separa atrasadas, hoje, próximas, sem data e feitas", () => {
    const g = agrupar(
      [item("depois", "2026-11-20"), item("sem"), item("velha", "2026-11-07"), item("hoje", "2026-11-08"), item("logo", "2026-11-09"), item("ok", "2026-11-07", "2026-11-08")],
      "2026-11-08",
    );
    expect(g.atrasadas.map((p) => p.id)).toEqual(["velha"]);
    expect(g.paraHoje.map((p) => p.id)).toEqual(["hoje"]);
    expect(g.proximas.map((p) => p.id)).toEqual(["logo", "depois"]);
    expect(g.semData.map((p) => p.id)).toEqual(["sem"]);
    expect(g.feitas.map((p) => p.id)).toEqual(["ok"]);
  });

  it("recusa data que não existe e aceita vazia", () => {
    expect(limparPrazo("2026-02-31")).toBeNull();
    expect(limparPrazo("10/11")).toBeNull();
    expect(limparPrazo("")).toBe("");
    expect(limparPrazo("2026-11-10")).toBe("2026-11-10");
  });

  it("vira o mês na soma de dias", () => {
    expect(somarDias("2026-11-29", 3)).toBe("2026-12-02");
  });

  it("não avisa quando só há prazo depois de 3 dias, sem data ou feita", () => {
    expect(montarAviso([item("longe", "2026-11-12"), item("sem"), item("ok", "2026-11-08", "2026-11-08")], "2026-11-08", LINK)).toBeNull();
  });

  it("avisa atrasadas, hoje e até 3 dias, com o link", () => {
    const texto = montarAviso(
      [item("velha", "2026-11-07"), item("hoje", "2026-11-08"), item("limite", "2026-11-11"), item("fora", "2026-11-12")],
      "2026-11-08",
      LINK,
    )!;
    expect(texto).toContain("Pendências de dom, 08/11");
    expect(texto).toContain("🔴 Atrasadas (1)\n• 07/11 velha");
    expect(texto).toContain("🟡 Hoje (1)\n• hoje");
    expect(texto).toContain("🔵 Próximos 3 dias (1)\n• 11/11 limite");
    expect(texto).not.toContain("fora");
    expect(texto.endsWith(LINK)).toBe(true);
  });
});
