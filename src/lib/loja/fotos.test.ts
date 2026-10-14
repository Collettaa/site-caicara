import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDb } from "@/lib/loja/db";
import { removerFoto, salvarFoto } from "@/lib/loja/fotos";
import { ErroLoja } from "@/lib/loja/pedidos";
import { buscarPorId, criarProduto } from "@/lib/loja/produtos";

// Mesmo regex da rota GET /api/loja/fotos/[arquivo].
const NOME_ROTA = /^[a-z0-9-]+\.(webp|jpg|jpeg|png)$/;

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const WEBP = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50]);
const PDF = new TextEncoder().encode("%PDF-1.7\n%âãÏÓ\n1 0 obj\n");

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "loja-fotos-"));
  process.env.DATA_DIR = dir;
});

afterEach(() => {
  delete process.env.DATA_DIR;
  fs.rmSync(dir, { recursive: true, force: true });
});

const caminhoDa = (url: string) => path.join(dir, "loja", "fotos", url.split("/").pop()!);

describe("salvarFoto", () => {
  it("PDF → erro", async () => {
    const arquivo = new File([PDF], "doc.pdf", { type: "application/pdf" });
    await expect(salvarFoto(arquivo)).rejects.toBeInstanceOf(ErroLoja);
  });

  it("PDF renomeado para .jpg com type image/jpeg → erro (vale a assinatura, não o nome)", async () => {
    const arquivo = new File([PDF], "foto.jpg", { type: "image/jpeg" });
    await expect(salvarFoto(arquivo)).rejects.toThrow(/JPG, PNG ou WEBP/);
  });

  it("9 MB → erro", async () => {
    const grande = new Uint8Array(9 * 1024 * 1024);
    grande.set(JPEG);
    const arquivo = new File([grande], "grande.jpg", { type: "image/jpeg" });
    await expect(salvarFoto(arquivo)).rejects.toThrow(/8 MB/);
  });

  it("vazio → erro", async () => {
    await expect(salvarFoto(new File([], "x.jpg", { type: "image/jpeg" }))).rejects.toBeInstanceOf(ErroLoja);
  });

  it("JPEG pequeno → arquivo existe e a URL bate com a rota de fotos", async () => {
    const url = await salvarFoto(new File([JPEG], "IMG_0001.JPG", { type: "image/jpeg" }));
    expect(url).toMatch(/^\/api\/loja\/fotos\//);
    const nome = url.slice("/api/loja/fotos/".length);
    expect(nome).toMatch(NOME_ROTA);
    expect(nome.endsWith(".jpg")).toBe(true);
    expect(fs.readFileSync(caminhoDa(url))).toEqual(Buffer.from(JPEG));
  });

  it("extensão sai da assinatura: PNG e WEBP mesmo com type errado", async () => {
    const png = await salvarFoto(new File([PNG], "a", { type: "application/octet-stream" }));
    const webp = await salvarFoto(new File([WEBP], "b.jpg", { type: "image/jpeg" }));
    expect(png.endsWith(".png")).toBe(true);
    expect(webp.endsWith(".webp")).toBe(true);
  });
});

describe("removerFoto", () => {
  const dados = (fotos: string[]) => ({
    nome: "Camiseta",
    descricao: "",
    preco: 7000,
    precoPix: 6500,
    parcelasMax: 2,
    fotos,
    variacoes: [],
  });

  it("tira da lista e apaga o arquivo quando ninguém mais usa", async () => {
    const db = openDb(":memory:");
    const url = await salvarFoto(new File([JPEG], "a.jpg", { type: "image/jpeg" }));
    const outra = await salvarFoto(new File([PNG], "b.png", { type: "image/png" }));
    const p = criarProduto(db, dados([url, outra]));

    await removerFoto(db, p.id, url);

    expect(buscarPorId(db, p.id)!.fotos).toEqual([outra]);
    expect(fs.existsSync(caminhoDa(url))).toBe(false);
    expect(fs.existsSync(caminhoDa(outra))).toBe(true);
  });

  it("mantém o arquivo se outro produto usa a mesma foto", async () => {
    const db = openDb(":memory:");
    const url = await salvarFoto(new File([JPEG], "a.jpg", { type: "image/jpeg" }));
    const p1 = criarProduto(db, dados([url]));
    const p2 = criarProduto(db, dados([url]));

    await removerFoto(db, p1.id, url);

    expect(buscarPorId(db, p1.id)!.fotos).toEqual([]);
    expect(buscarPorId(db, p2.id)!.fotos).toEqual([url]);
    expect(fs.existsSync(caminhoDa(url))).toBe(true);
  });

  it("URL fora da pasta de fotos não apaga nada fora dela", async () => {
    const db = openDb(":memory:");
    const fora = path.join(dir, "loja.db");
    fs.writeFileSync(fora, "x");
    const url = "/api/loja/fotos/../../loja.db";
    const p = criarProduto(db, dados([url]));

    await removerFoto(db, p.id, url);

    expect(buscarPorId(db, p.id)!.fotos).toEqual([]);
    expect(fs.existsSync(fora)).toBe(true);
  });
});
