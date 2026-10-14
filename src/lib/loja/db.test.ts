import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDb, transacao } from "@/lib/loja/db";

const TABELAS = ["itens", "mensagens", "pedidos", "produtos", "variacoes"];

function tabelas(db: ReturnType<typeof openDb>): string[] {
  return (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all() as { name: string }[]
  ).map((r) => r.name);
}

function produtoComVariacao(db: ReturnType<typeof openDb>, estoque = 1): number {
  const agora = new Date().toISOString();
  const p = db
    .prepare(
      "INSERT INTO produtos (slug, nome, descricao, preco, preco_pix, parcelas_max, ativo, fotos, criado_em) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)",
    )
    .run("camiseta-caicara", "Camiseta Caiçara", "", 7000, 6500, 2, "[]", agora);
  const v = db
    .prepare("INSERT INTO variacoes (produto_id, modelo, tamanho, estoque, ordem, ativo) VALUES (?, ?, ?, ?, 0, 1)")
    .run(Number(p.lastInsertRowid), "Baby look", "P", estoque);
  return Number(v.lastInsertRowid);
}

const temporarios: string[] = [];
afterEach(() => {
  for (const dir of temporarios.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe("openDb", () => {
  it("cria as 5 tabelas em memória", () => {
    const db = openDb(":memory:");
    expect(tabelas(db)).toEqual(TABELAS);
    db.close();
  });

  it("abrir duas vezes o mesmo arquivo não falha", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "loja-"));
    temporarios.push(dir);
    const file = path.join(dir, "loja.db");
    const a = openDb(file);
    a.close();
    const b = openDb(file);
    expect(tabelas(b)).toEqual(TABELAS);
    b.close();
  });

  it("liga foreign keys", () => {
    const db = openDb(":memory:");
    expect(() =>
      db
        .prepare("INSERT INTO variacoes (produto_id, modelo, tamanho, estoque, ordem, ativo) VALUES (999, 'x', 'P', 1, 0, 1)")
        .run(),
    ).toThrow();
    db.close();
  });

  it("estoque nunca fica negativo (CHECK)", () => {
    const db = openDb(":memory:");
    const id = produtoComVariacao(db);
    expect(() => db.prepare("UPDATE variacoes SET estoque = -1 WHERE id = ?").run(id)).toThrow();
    db.close();
  });
});

describe("transacao", () => {
  it("confirma e devolve o resultado", () => {
    const db = openDb(":memory:");
    const id = produtoComVariacao(db, 3);
    const r = transacao(db, () => {
      db.prepare("UPDATE variacoes SET estoque = estoque - 1 WHERE id = ?").run(id);
      return "ok";
    });
    expect(r).toBe("ok");
    expect(db.prepare("SELECT estoque FROM variacoes WHERE id = ?").get(id)).toEqual({ estoque: 2 });
    db.close();
  });

  it("desfaz tudo se fn lançar", () => {
    const db = openDb(":memory:");
    const id = produtoComVariacao(db, 3);
    expect(() =>
      transacao(db, () => {
        db.prepare("UPDATE variacoes SET estoque = 0 WHERE id = ?").run(id);
        db.prepare(
          "INSERT INTO produtos (slug, nome, descricao, preco, parcelas_max, ativo, fotos, criado_em) VALUES ('outro', 'Outro', '', 100, 1, 1, '[]', '2026-10-14T00:00:00.000Z')",
        ).run();
        throw new Error("falhou");
      }),
    ).toThrow("falhou");
    expect(db.prepare("SELECT estoque FROM variacoes WHERE id = ?").get(id)).toEqual({ estoque: 3 });
    expect(db.prepare("SELECT COUNT(*) AS n FROM produtos").get()).toEqual({ n: 1 });
    db.close();
  });
});
