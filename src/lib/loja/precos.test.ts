import { describe, expect, it } from "vitest";
import { parcelasPermitidas, precoUnitario } from "@/lib/loja/precos";

const camiseta = { preco: 7000, precoPix: 6500 };

describe("precoUnitario", () => {
  it("Pix usa o preço Pix; cartão usa o preço normal", () => {
    expect(precoUnitario(camiseta, "pix")).toBe(6500);
    expect(precoUnitario(camiseta, "balcao_pix")).toBe(6500);
    expect(precoUnitario(camiseta, "cartao1")).toBe(7000);
    expect(precoUnitario(camiseta, "cartao2")).toBe(7000);
    expect(precoUnitario(camiseta, "balcao_dinheiro")).toBe(7000);
    expect(precoUnitario(camiseta, "balcao_cartao")).toBe(7000);
  });

  it("produto sem preço Pix usa o preço normal no Pix", () => {
    expect(precoUnitario({ preco: 5000, precoPix: null }, "pix")).toBe(5000);
  });
});

describe("parcelasPermitidas", () => {
  it("vale o menor parcelasMax do carrinho", () => {
    expect(parcelasPermitidas([{ parcelasMax: 2 }, { parcelasMax: 1 }])).toBe(1);
    expect(parcelasPermitidas([{ parcelasMax: 2 }])).toBe(2);
  });

  it("carrinho vazio → 1", () => {
    expect(parcelasPermitidas([])).toBe(1);
  });
});
