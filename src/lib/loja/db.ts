import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  preco INTEGER NOT NULL,
  preco_pix INTEGER,
  parcelas_max INTEGER NOT NULL DEFAULT 1,
  ativo INTEGER NOT NULL DEFAULT 1,
  fotos TEXT NOT NULL DEFAULT '[]',
  criado_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS variacoes (
  id INTEGER PRIMARY KEY,
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  modelo TEXT NOT NULL,
  tamanho TEXT NOT NULL,
  estoque INTEGER NOT NULL DEFAULT 0 CHECK (estoque >= 0),
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS variacoes_produto ON variacoes(produto_id);

CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  aceita_msgs INTEGER NOT NULL DEFAULT 0,
  forma TEXT NOT NULL,
  origem TEXT NOT NULL DEFAULT 'site',
  status TEXT NOT NULL,
  total INTEGER NOT NULL,
  liquido INTEGER,
  asaas_id TEXT,
  asaas_parcelamento_id TEXT,
  pix_qr TEXT,
  pix_copia_cola TEXT,
  invoice_url TEXT,
  reservado_ate TEXT,
  criado_em TEXT NOT NULL,
  pago_em TEXT,
  entregue_em TEXT
);
CREATE INDEX IF NOT EXISTS pedidos_status ON pedidos(status);

CREATE TABLE IF NOT EXISTS itens (
  id INTEGER PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id),
  variacao_id INTEGER NOT NULL REFERENCES variacoes(id),
  qtd INTEGER NOT NULL,
  preco_unit INTEGER NOT NULL,
  descricao TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS itens_pedido ON itens(pedido_id);

CREATE TABLE IF NOT EXISTS mensagens (
  id INTEGER PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id),
  tipo TEXT NOT NULL,
  tentativas INTEGER NOT NULL DEFAULT 0,
  enviada_em TEXT,
  erro TEXT,
  UNIQUE (pedido_id, tipo)
);
`;

/** Abre o banco, liga foreign keys e WAL e cria as tabelas que faltarem (idempotente). */
export function openDb(file: string): DatabaseSync {
  const db = new DatabaseSync(file);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(ESQUEMA);
  return db;
}

const global = globalThis as typeof globalThis & { __lojaDb?: DatabaseSync };

/** Banco único do processo em `${DATA_DIR}/loja.db`. */
export function getDb(): DatabaseSync {
  if (!global.__lojaDb) {
    const dir = process.env.DATA_DIR ?? "data";
    fs.mkdirSync(dir, { recursive: true });
    global.__lojaDb = openDb(path.join(dir, "loja.db"));
  }
  return global.__lojaDb;
}

/** Roda `fn` dentro de BEGIN IMMEDIATE; COMMIT se der certo, ROLLBACK se lançar. */
export function transacao<T>(db: DatabaseSync, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const resultado = fn();
    db.exec("COMMIT");
    return resultado;
  } catch (erro) {
    db.exec("ROLLBACK");
    throw erro;
  }
}
