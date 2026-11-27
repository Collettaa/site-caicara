import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDb } from "@/lib/loja/db";
import { linkWhatsapp, resumo, tokenTreinao, tokenTreinaoValido, total, vendasDaLoja, vendasDoBambu } from "@/lib/treinao-camisetas";

describe("link do treinão", () => {
  beforeEach(() => {
    process.env.ADMIN_COOKIE_SECRET = "segredo-teste";
  });
  afterEach(() => {
    delete process.env.ADMIN_COOKIE_SECRET;
  });
  it("vale até 30/11 e não aceita outro token", () => {
    const t = tokenTreinao();
    expect(tokenTreinaoValido(t, new Date("2026-11-27T23:00:00Z"))).toBe(true);
    expect(tokenTreinaoValido(t, new Date("2026-12-01T03:30:00Z"))).toBe(false); // 01/12 00:30 em SP
    expect(tokenTreinaoValido("0".repeat(24), new Date("2026-11-27T23:00:00Z"))).toBe(false);
  });
});

describe("vendas do treinão", () => {
  it("só conta a camiseta do treinão e junta loja + /bambu", () => {
    const db = openDb(":memory:");
    db.exec(`INSERT INTO produtos (id, nome, slug, preco, criado_em) VALUES (2, 'Camiseta Treinão', 'camiseta-treinao-bambu', 7000, 'x'), (3, 'Grip', 'grip', 5000, 'x')`);
    const colunas = (db.prepare("PRAGMA table_info(variacoes)").all() as { name: string }[]).map((c) => c.name);
    expect(colunas).toContain("tamanho");
    db.exec(`INSERT INTO variacoes (id, produto_id, modelo, tamanho, estoque) VALUES (7, 2, 'Dry fit', 'M', 5), (8, 2, 'Dry fit', 'G', 2), (9, 3, 'Grip', 'U', 1)`);
    const ped = db.prepare(
      `INSERT INTO pedidos (id, codigo, nome, whatsapp, forma, origem, status, total, criado_em, pago_em, entregue_em)
       VALUES (?, ?, ?, '5513999990000', 'pix', 'site', ?, 7000, '2026-11-25T10:00:00Z', '2026-11-25T10:05:00Z', ?)`,
    );
    ped.run(1, "a", "Ana", "pago", null);
    ped.run(2, "b", "Bia", "entregue", "2026-11-27T23:00:00Z");
    ped.run(3, "c", "Caio", "aguardando", null);
    ped.run(4, "d", "Duda", "pago", null);
    const item = db.prepare(`INSERT INTO itens (pedido_id, variacao_id, qtd, preco_unit, descricao) VALUES (?, ?, ?, 7000, 'x')`);
    item.run(1, 7, 2);
    item.run(2, 8, 1);
    item.run(3, 7, 1);
    item.run(4, 9, 1); // só grip: não aparece

    const loja = vendasDaLoja(db);
    expect(loja.map((v) => v.nome)).toEqual(["Ana", "Bia"]);
    const bambu = vendasDoBambu([
      { id: "pay_1", nome: "Edu", whatsapp: "5513988887777", itens: { M: 1 }, total: 70, forma: "pix", criadoEm: "2026-11-20T10:00:00Z", pago: true },
      { id: "pay_2", nome: "Fê", whatsapp: "5513988887777", itens: { G: 1 }, total: 70, forma: "pix", criadoEm: "2026-11-20T10:00:00Z" },
    ]);
    const r = resumo([...loja, ...bambu]);
    expect(total(r.vendidas)).toBe(4);
    expect(r.faltam).toEqual({ M: 3 });
    expect(r.entregues).toEqual({ G: 1 });
  });

  it("monta o link do WhatsApp com ou sem 55", () => {
    expect(linkWhatsapp("13999990000", "oi")).toBe("https://wa.me/5513999990000?text=oi");
    expect(linkWhatsapp("", "oi")).toBeNull();
  });
});
