// Fotos dos produtos: salvas em ${DATA_DIR}/loja/fotos/ e servidas por /api/loja/fotos/[arquivo]. Só servidor.

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { ErroLoja } from "./pedidos";
import { atualizarProduto, buscarPorId } from "./produtos";

export const FOTO_MAX_BYTES = 8 * 1024 * 1024;
export const PREFIXO_URL = "/api/loja/fotos/";

/** Mesmo regex da rota de fotos: o nome nunca sai da pasta. */
const NOME = /^[a-z0-9-]+\.(webp|jpg|jpeg|png)$/;

type Extensao = "jpg" | "png" | "webp";

export function pastaFotos(): string {
  return path.resolve(process.env.DATA_DIR ?? "data", "loja", "fotos");
}

/** Tipo real pelos primeiros bytes. O `type` que o navegador manda não conta. */
export function extensaoPelaAssinatura(b: Uint8Array): Extensao | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length >= 8 && png.every((x, i) => b[i] === x)) return "png";
  const ascii = (de: number, ate: number) => String.fromCharCode(...b.subarray(de, ate));
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

/** Salva a foto como "<uuid>.<ext>" e devolve "/api/loja/fotos/<nome>". Tipo ou tamanho fora → ErroLoja. */
export async function salvarFoto(arquivo: File): Promise<string> {
  if (arquivo.size === 0) throw new ErroLoja("limite", "A foto veio vazia. Escolhe de novo.");
  if (arquivo.size > FOTO_MAX_BYTES) throw new ErroLoja("limite", "Foto grande demais (máximo 8 MB).");

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const ext = extensaoPelaAssinatura(bytes);
  if (!ext) throw new ErroLoja("limite", "Essa foto não é JPG, PNG ou WEBP.");

  const pasta = pastaFotos();
  await fs.mkdir(pasta, { recursive: true });
  const nome = `${randomUUID().toLowerCase()}.${ext}`;
  await fs.writeFile(path.join(pasta, nome), bytes, { flag: "wx" });
  return `${PREFIXO_URL}${nome}`;
}

/** Caminho do arquivo da URL, ou null se a URL não for de uma foto nossa. */
function caminhoDaUrl(url: string): string | null {
  if (!url.startsWith(PREFIXO_URL)) return null;
  const nome = url.slice(PREFIXO_URL.length);
  if (!NOME.test(nome)) return null;
  const pasta = pastaFotos();
  const caminho = path.join(pasta, nome);
  return path.dirname(caminho) === pasta ? caminho : null;
}

/** Tira a foto do produto e apaga o arquivo só se nenhum produto usar mais. */
export async function removerFoto(db: DatabaseSync, produtoId: number, url: string): Promise<void> {
  const produto = buscarPorId(db, produtoId);
  if (!produto) throw new ErroLoja("nao_encontrado", "Produto não encontrado.");
  atualizarProduto(db, produtoId, { fotos: produto.fotos.filter((f) => f !== url) });

  const emUso = db.prepare("SELECT 1 FROM produtos, json_each(produtos.fotos) WHERE json_each.value = ? LIMIT 1").get(url);
  if (emUso) return;
  const caminho = caminhoDaUrl(url);
  if (caminho) await fs.rm(caminho, { force: true });
}
