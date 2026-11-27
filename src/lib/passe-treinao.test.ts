import { describe, expect, it } from "vitest";
import { diasDisponiveis, horarioValido, juntarPasses } from "@/lib/passe-treinao";

describe("passe do treinão", () => {
  const sexta = new Date("2026-11-27T21:00:00Z"); // 18h em SP
  it("vai de amanhã até 07/12, sem o dia do Murph", () => {
    const d = diasDisponiveis(sexta);
    expect(d[0].data).toBe("2026-11-30"); // sáb 28 e dom 29 ficam fora
    expect(d.every((x) => x.horarios.includes("7h"))).toBe(true);
    expect(d.some((x) => x.data === "2026-12-05" || x.data === "2026-12-06")).toBe(false);
    expect(d.at(-1)?.data).toBe("2026-12-07");
    expect(d.some((x) => x.data === "2026-12-04")).toBe(false);
    expect(d.find((x) => x.data === "2026-12-01")?.horarios).toContain("7h");
  });
  it("só aceita horário da grade", () => {
    expect(horarioValido("2026-11-30", "9h", sexta)).toBe(true);
    expect(horarioValido("2026-11-30", "7h", sexta)).toBe(true);
    expect(horarioValido("2026-11-28", "10h", sexta)).toBe(false);
    expect(horarioValido("2026-11-27", "19h30", sexta)).toBe(false);
    expect(horarioValido("2026-12-08", "9h", sexta)).toBe(false);
  });
  it("depois de 07/12 não tem mais dia", () => {
    expect(diasDisponiveis(new Date("2026-12-07T15:00:00Z"))).toEqual([]);
  });
  it("mesma pessoa vale a última marcação", () => {
    const l = (o: object) => JSON.stringify(o);
    const r = juntarPasses([l({ whatsapp: "1", data: "a" }), l({ whatsapp: "2", data: "b" }), l({ whatsapp: "1", data: "c" })].join("\n"));
    expect(r.map((p) => p.data)).toEqual(["b", "c"]);
  });
});

describe("instagram do passe", () => {
  it("limpa @, link e maiúscula; vazio ou inválido vira nada", async () => {
    const { limparInstagram } = await import("@/lib/passe-treinao");
    expect(limparInstagram(" @Fulano.Fit ")).toBe("fulano.fit");
    expect(limparInstagram("https://www.instagram.com/fulano_fit/?hl=pt")).toBe("fulano_fit");
    expect(limparInstagram("")).toBeUndefined();
    expect(limparInstagram("não tenho")).toBeUndefined();
  });
});
