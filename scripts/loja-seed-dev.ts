// Só para desenvolvimento: cria a Camiseta Caiçara no banco local da loja.
// Uso: npx tsx scripts/loja-seed-dev.ts   (DATA_DIR do .env.local; padrão ./data)
// Idempotente: se o produto já existe, não cria de novo; foto já copiada não é sobrescrita.

import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { getDb } from "../src/lib/loja/db";
import { criarProduto } from "../src/lib/loja/produtos";

loadEnvConfig(process.cwd(), true);

const ORIGEM = "C:\\Users\\HOME\\Documents\\Caicara.app\\loja\\camiseta-caicara";
const SLUG = "camiseta-caicara";

// arquivo de origem → nome na pasta de fotos (precisa bater com ^[a-z0-9-]+\.(webp|jpg|jpeg|png)$)
const FOTOS: [string, string][] = [
  ["tradicional.webp", "camiseta-caicara-tradicional.webp"],
  ["baby-look.webp", "camiseta-caicara-baby-look.webp"],
  ["medidas.jpg", "camiseta-caicara-medidas.jpg"],
];

const dataDir = process.env.DATA_DIR ?? "data";
const pastaFotos = path.resolve(dataDir, "loja", "fotos");
fs.mkdirSync(pastaFotos, { recursive: true });

for (const [origem, destino] of FOTOS) {
  const alvo = path.join(pastaFotos, destino);
  if (fs.existsSync(alvo)) continue;
  fs.copyFileSync(path.join(ORIGEM, origem), alvo);
  console.log(`foto copiada: ${destino}`);
}

const db = getDb();
const existe = db.prepare("SELECT id FROM produtos WHERE slug = ?").get(SLUG) as { id: number } | undefined;

if (existe) {
  console.log(`"${SLUG}" já existe (id ${existe.id}). Nada a fazer.`);
} else {
  const produto = criarProduto(db, {
    nome: "Camiseta Caiçara",
    descricao: "Preta, estampa rosa. Na frente, o script com coqueiro; nas costas, o selo do kettlebell.",
    preco: 7000,
    precoPix: 6500,
    parcelasMax: 2,
    fotos: FOTOS.map(([, nome]) => `/api/loja/fotos/${nome}`),
    variacoes: [
      { modelo: "Baby look", tamanho: "P", estoque: 3 },
      { modelo: "Baby look", tamanho: "M", estoque: 9 },
      { modelo: "Baby look", tamanho: "G", estoque: 7 },
      { modelo: "Tradicional", tamanho: "P", estoque: 3 },
      { modelo: "Tradicional", tamanho: "M", estoque: 4 },
      { modelo: "Tradicional", tamanho: "G", estoque: 4 },
    ],
  });
  console.log(`criado: ${produto.nome} (/loja/${produto.slug}) em ${path.resolve(dataDir, "loja.db")}`);
}

db.close();
