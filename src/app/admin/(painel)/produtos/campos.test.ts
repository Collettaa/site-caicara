import { describe, expect, it } from "vitest";
import { centavosDeReais, lerDadosProduto, lerVariacao } from "./campos";

const form = (campos: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
};

describe("centavosDeReais", () => {
  it.each([
    ["70", 7000],
    ["70,00", 7000],
    ["65,5", 6550],
    ["R$ 65,90", 6590],
    ["35.5", 3550],
    ["1.234,56", 123456],
    ["1.000", 100000],
  ])("%s → %d", (t, c) => expect(centavosDeReais(t)).toBe(c));

  it("vazio → null; lixo → NaN", () => {
    expect(centavosDeReais("  ")).toBeNull();
    expect(centavosDeReais("setenta")).toBeNaN();
    expect(centavosDeReais("70,123")).toBeNaN();
    expect(centavosDeReais("-5")).toBeNaN();
  });
});

describe("lerDadosProduto", () => {
  const base = { nome: "Camiseta", descricao: "", preco: "70", precoPix: "65", parcelasMax: "2" };

  it("camiseta do spec", () => {
    expect(lerDadosProduto(form(base))).toEqual({
      ok: true,
      dados: { nome: "Camiseta", descricao: "", preco: 7000, precoPix: 6500, parcelasMax: 2, etiqueta: "" },
    });
  });

  it("etiqueta: lida sem espaços nas pontas; até 30 letras", () => {
    const r = lerDadosProduto(form({ ...base, etiqueta: "  edição Outubro Rosa " }));
    expect(r.ok && r.dados.etiqueta).toBe("edição Outubro Rosa");
    expect(lerDadosProduto(form({ ...base, etiqueta: "a".repeat(30) })).ok).toBe(true);
    expect(lerDadosProduto(form({ ...base, etiqueta: "a".repeat(31) }))).toEqual({
      ok: false,
      erro: "Anotação da etiqueta comprida demais (máximo 30 letras).",
    });
  });

  it("Pix vazio → null", () => {
    const r = lerDadosProduto(form({ ...base, precoPix: "" }));
    expect(r.ok && r.dados.precoPix).toBeNull();
  });

  it("Pix maior que o preço normal → erro; Pix igual passa", () => {
    expect(lerDadosProduto(form({ ...base, precoPix: "75" }))).toEqual({
      ok: false,
      erro: "O preço no Pix não pode ser maior que o preço normal.",
    });
    expect(lerDadosProduto(form({ ...base, precoPix: "70" })).ok).toBe(true);
  });

  it("preço até R$ 100.000", () => {
    expect(lerDadosProduto(form({ ...base, preco: "100.000", precoPix: "" })).ok).toBe(true);
    expect(lerDadosProduto(form({ ...base, preco: "100.000,01", precoPix: "" })).ok).toBe(false);
  });

  it.each([
    { preco: "0" },
    { preco: "" },
    { preco: "abc" },
    { precoPix: "0" },
    { parcelasMax: "0" },
    { parcelasMax: "13" },
    { parcelasMax: "1.5" },
    { nome: " " },
  ])("recusa %o", (troca) => {
    expect(lerDadosProduto(form({ ...base, ...troca })).ok).toBe(false);
  });
});

describe("lerVariacao", () => {
  it("modelo + tamanho + estoque", () => {
    expect(lerVariacao(form({ modelo: "Baby look", tamanho: "p", estoque: "3" }))).toEqual({
      ok: true,
      dados: { modelo: "Baby look", tamanho: "P", estoque: 3 },
    });
  });

  it("recusa estoque negativo ou quebrado e campo vazio", () => {
    expect(lerVariacao(form({ modelo: "X", tamanho: "P", estoque: "-1" })).ok).toBe(false);
    expect(lerVariacao(form({ modelo: "X", tamanho: "P", estoque: "2,5" })).ok).toBe(false);
    expect(lerVariacao(form({ modelo: "", tamanho: "P", estoque: "1" })).ok).toBe(false);
  });
});
