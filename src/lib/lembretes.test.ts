import { describe, expect, it } from "vitest";
import { type Lembrete, agoraSP, decidir, quandoValido } from "@/lib/lembretes";

const l = (id: string, quando: string, x: Partial<Lembrete> = {}): Lembrete => ({ id, quando, texto: "oi", grupo: "alunos", criadoEm: "", ...x });

describe("lembretes", () => {
  it("agoraSP no fuso de São Paulo", () => {
    expect(agoraSP(new Date("2026-11-23T22:05:00Z"))).toBe("2026-11-23 19:05");
  });

  it("quandoValido", () => {
    expect(quandoValido("2026-11-25", "12:00")).toBe("2026-11-25 12:00");
    expect(quandoValido("2026-02-31", "12:00")).toBeNull();
    expect(quandoValido("2026-11-25", "25:00")).toBeNull();
  });

  it("manda um por vez, pula o que passou de 3 h, ignora futuro e enviado", () => {
    const itens = [
      l("velho", "2026-11-23 10:00"),
      l("ja", "2026-11-23 18:00", { enviadoEm: "x" }),
      l("agora", "2026-11-23 19:00"),
      l("depois", "2026-11-23 19:10"),
      l("futuro", "2026-11-25 12:00"),
    ];
    expect(decidir(itens, "2026-11-23 19:10")).toEqual({ pular: ["velho"], enviar: itens[2] });
  });
});
