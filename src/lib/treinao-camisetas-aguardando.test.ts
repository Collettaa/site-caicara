import { describe, expect, it } from "vitest";
import { openDb } from "@/lib/loja/db";
import { aguardandoNaLoja, resumo, total, vendasDaLoja } from "@/lib/treinao-camisetas";

describe("aguardando na loja", () => {
  it("conta só pedido aguardando da camiseta e não mistura com pagos", () => {
    const db = openDb(":memory:");
    db.exec(`INSERT INTO produtos (id, nome, slug, preco, criado_em) VALUES (2, 'Camiseta', 'camiseta-treinao-bambu', 7000, 'x')`);
    db.exec(`INSERT INTO variacoes (id, produto_id, modelo, tamanho, estoque) VALUES (7, 2, 'Dry fit', 'M', 5)`);
    const ped = db.prepare(`INSERT INTO pedidos (id, codigo, nome, whatsapp, forma, origem, status, total, criado_em) VALUES (?, ?, 'X', '', 'pix', 'site', ?, 7000, 'x')`);
    ped.run(1, "a", "aguardando");
    ped.run(2, "b", "pago");
    ped.run(3, "c", "expirado");
    const item = db.prepare(`INSERT INTO itens (pedido_id, variacao_id, qtd, preco_unit, descricao) VALUES (?, 7, 1, 7000, 'x')`);
    [1, 2, 3].forEach((id) => item.run(id));
    expect(aguardandoNaLoja(db)).toEqual({ M: 1 });
    expect(total(resumo(vendasDaLoja(db)).vendidas)).toBe(1);
  });
});
