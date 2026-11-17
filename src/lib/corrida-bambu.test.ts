import { describe, expect, it } from "vitest";
import { contarCamisetas, juntarInscricoes } from "@/lib/corrida-bambu";

const linha = (o: object) => JSON.stringify(o);

describe("juntarInscricoes", () => {
  it("ajuste marca o Pix como pago", () => {
    const raw = [linha({ nome: "Ana", whatsapp: "5513", criadoEm: "x", camiseta: "M", pagamentoId: "pay_1" }), linha({ ajuste: "5513", pixPago: true })].join("\n");
    expect(juntarInscricoes(raw)).toEqual([{ nome: "Ana", whatsapp: "5513", criadoEm: "x", camiseta: "M", pagamentoId: "pay_1", pixPago: true }]);
  });

  it("reinscrição sem camiseta mantém a camiseta paga", () => {
    const raw = [
      linha({ nome: "Ana", whatsapp: "5513", criadoEm: "x", camiseta: "M", pagamentoId: "pay_1" }),
      linha({ ajuste: "5513", pixPago: true }),
      linha({ nome: "Ana Paula", whatsapp: "5513", criadoEm: "y" }),
    ].join("\n");
    expect(juntarInscricoes(raw)[0]).toMatchObject({ nome: "Ana Paula", camiseta: "M", pixPago: true });
  });

  it("reinscrição sem camiseta descarta pedido não pago", () => {
    const raw = [linha({ nome: "Ana", whatsapp: "5513", criadoEm: "x", camiseta: "M", pagamentoId: "pay_1" }), linha({ nome: "Ana", whatsapp: "5513", criadoEm: "y" })].join("\n");
    expect(juntarInscricoes(raw)[0].camiseta).toBeUndefined();
  });
});

describe("contarCamisetas", () => {
  it("separa pagas por tamanho e aguardando", () => {
    const r = contarCamisetas([
      { nome: "a", whatsapp: "1", criadoEm: "", camiseta: "M", pixPago: true },
      { nome: "b", whatsapp: "2", criadoEm: "", camiseta: "GG" },
      { nome: "c", whatsapp: "3", criadoEm: "" },
    ]);
    expect(r).toEqual({ pagas: { P: 0, M: 1, G: 0, GG: 0 }, aguardando: 1 });
  });
});
