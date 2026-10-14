import { beforeEach, describe, expect, it } from "vitest";
import { openDb } from "@/lib/loja/db";
import {
  adicionarVariacao,
  ajustarEstoque,
  atualizarProduto,
  buscarPorId,
  buscarPorSlug,
  criarProduto,
  definirAtivo,
  listarAtivos,
  listarTodos,
} from "@/lib/loja/produtos";

type Db = ReturnType<typeof openDb>;

const camiseta = {
  nome: "Camiseta Caiçara",
  descricao: "Algodão, estampa da marca",
  preco: 7000,
  precoPix: 6500,
  parcelasMax: 2,
  fotos: ["/api/loja/fotos/a.jpg"],
  variacoes: [
    { modelo: "Baby look", tamanho: "P", estoque: 3 },
    { modelo: "Baby look", tamanho: "M", estoque: 0 },
    { modelo: "Tradicional", tamanho: "G", estoque: 5 },
  ],
};

let db: Db;
beforeEach(() => {
  db = openDb(":memory:");
});

describe("criarProduto", () => {
  it("grava produto e variações e devolve camelCase", () => {
    const p = criarProduto(db, camiseta);
    expect(p).toMatchObject({
      slug: "camiseta-caicara",
      nome: "Camiseta Caiçara",
      preco: 7000,
      precoPix: 6500,
      parcelasMax: 2,
      ativo: true,
      fotos: ["/api/loja/fotos/a.jpg"],
    });
    expect(typeof p.criadoEm).toBe("string");
    const completo = buscarPorId(db, p.id)!;
    expect(completo.variacoes.map((v) => [v.modelo, v.tamanho, v.estoque, v.ordem])).toEqual([
      ["Baby look", "P", 3, 0],
      ["Baby look", "M", 0, 1],
      ["Tradicional", "G", 5, 2],
    ]);
    expect(completo.variacoes.every((v) => v.ativo === true && v.produtoId === p.id)).toBe(true);
  });

  it("slug sem acento, minúsculo, hífen; repetido ganha -2, -3", () => {
    expect(criarProduto(db, camiseta).slug).toBe("camiseta-caicara");
    expect(criarProduto(db, camiseta).slug).toBe("camiseta-caicara-2");
    expect(criarProduto(db, camiseta).slug).toBe("camiseta-caicara-3");
    expect(criarProduto(db, { ...camiseta, nome: "  Regata Ação & Praia!! " }).slug).toBe("regata-acao-praia");
  });

  it("variação com estoque negativo não grava nada", () => {
    expect(() =>
      criarProduto(db, { ...camiseta, variacoes: [{ modelo: "X", tamanho: "P", estoque: -1 }] }),
    ).toThrow();
    expect(listarTodos(db)).toEqual([]);
  });
});

describe("ajustarEstoque", () => {
  it("soma e subtrai e retorna o novo estoque", () => {
    const p = criarProduto(db, camiseta);
    const v = buscarPorId(db, p.id)!.variacoes[0];
    expect(ajustarEstoque(db, v.id, 2)).toBe(5);
    expect(ajustarEstoque(db, v.id, -1)).toBe(4);
  });

  it("nunca abaixo de 0 (Review Focus 4)", () => {
    const p = criarProduto(db, camiseta);
    const [p3, m0] = buscarPorId(db, p.id)!.variacoes;
    expect(ajustarEstoque(db, p3.id, -5)).toBe(0);
    expect(ajustarEstoque(db, m0.id, -1)).toBe(0);
    expect(buscarPorId(db, p.id)!.variacoes[1].estoque).toBe(0);
  });

  it("variação inexistente lança erro", () => {
    expect(() => ajustarEstoque(db, 999, 1)).toThrow();
  });
});

describe("listagens", () => {
  it("listarAtivos não traz produto oculto nem variação inativa", () => {
    const a = criarProduto(db, camiseta);
    const b = criarProduto(db, { ...camiseta, nome: "Boné" });
    definirAtivo(db, b.id, false);
    const va = buscarPorId(db, a.id)!.variacoes[1];
    db.prepare("UPDATE variacoes SET ativo = 0 WHERE id = ?").run(va.id);

    const ativos = listarAtivos(db);
    expect(ativos.map((p) => p.slug)).toEqual(["camiseta-caicara"]);
    expect(ativos[0].variacoes.map((v) => v.tamanho)).toEqual(["P", "G"]);

    const todos = listarTodos(db);
    expect(todos.map((p) => p.slug)).toEqual(["camiseta-caicara", "bone"]);
    expect(todos[0].variacoes).toHaveLength(3);
    expect(todos[1].ativo).toBe(false);
  });

  it("buscarPorSlug só acha produto ativo e só com variações ativas; buscarPorId acha tudo", () => {
    const p = criarProduto(db, camiseta);
    const v = buscarPorId(db, p.id)!.variacoes[0];
    db.prepare("UPDATE variacoes SET ativo = 0 WHERE id = ?").run(v.id);
    expect(buscarPorSlug(db, "camiseta-caicara")!.variacoes).toHaveLength(2);
    expect(buscarPorSlug(db, "nao-existe")).toBeNull();

    definirAtivo(db, p.id, false);
    expect(buscarPorSlug(db, "camiseta-caicara")).toBeNull();
    expect(buscarPorId(db, p.id)!.variacoes).toHaveLength(3);
    expect(buscarPorId(db, 999)).toBeNull();
  });
});

describe("edição", () => {
  it("atualizarProduto muda só o que veio e mantém o slug", () => {
    const p = criarProduto(db, camiseta);
    const novo = atualizarProduto(db, p.id, { nome: "Camiseta Nova", preco: 8000, precoPix: null, fotos: [] });
    expect(novo).toMatchObject({
      slug: "camiseta-caicara",
      nome: "Camiseta Nova",
      preco: 8000,
      precoPix: null,
      parcelasMax: 2,
      descricao: camiseta.descricao,
      fotos: [],
    });
    expect(buscarPorId(db, p.id)!.preco).toBe(8000);
  });

  it("etiqueta: vazia por padrão, gravada no criar e no atualizar", () => {
    expect(criarProduto(db, camiseta).etiqueta).toBe("");
    const p = criarProduto(db, { ...camiseta, etiqueta: "edição Outubro Rosa" });
    expect(buscarPorId(db, p.id)!.etiqueta).toBe("edição Outubro Rosa");
    expect(atualizarProduto(db, p.id, { etiqueta: "" }).etiqueta).toBe("");
    expect(atualizarProduto(db, p.id, { nome: "Outra" }).etiqueta).toBe("");
    expect(atualizarProduto(db, p.id, { etiqueta: "última leva" }).etiqueta).toBe("última leva");
  });

  it("atualizarProduto em produto inexistente lança erro", () => {
    expect(() => atualizarProduto(db, 999, { nome: "x" })).toThrow();
  });

  it("adicionarVariacao entra no fim da ordem", () => {
    const p = criarProduto(db, camiseta);
    const v = adicionarVariacao(db, p.id, { modelo: "Tradicional", tamanho: "GG", estoque: 2 });
    expect(v).toMatchObject({ produtoId: p.id, modelo: "Tradicional", tamanho: "GG", estoque: 2, ordem: 3, ativo: true });
    expect(buscarPorId(db, p.id)!.variacoes.map((x) => x.tamanho)).toEqual(["P", "M", "G", "GG"]);
  });

  it("definirAtivo liga e desliga", () => {
    const p = criarProduto(db, camiseta);
    definirAtivo(db, p.id, false);
    expect(buscarPorId(db, p.id)!.ativo).toBe(false);
    definirAtivo(db, p.id, true);
    expect(buscarPorId(db, p.id)!.ativo).toBe(true);
  });
});
