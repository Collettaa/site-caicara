import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/loja/verificador", () => ({ dispararCiclo: vi.fn() }));
vi.mock("@/lib/loja/pedidos", async (original) => {
  const m = await original<typeof import("@/lib/loja/pedidos")>();
  return { ...m, marcarPago: vi.fn(m.marcarPago) };
});

import { POST } from "@/app/api/loja/asaas/route";
import { getDb } from "@/lib/loja/db";
import { buscarPorCodigo, criarPedido, marcarPago, salvarCobranca } from "@/lib/loja/pedidos";
import { buscarPorId, criarProduto } from "@/lib/loja/produtos";
import { dispararCiclo } from "@/lib/loja/verificador";

const TOKEN = "token-do-webhook-123";
const ASAAS = "https://asaas.test/v3";

let dir: string;
let db: DatabaseSync;
let variacao: number;
let statusPagamento: string;
let fetchMock: ReturnType<typeof vi.fn>;

const g = globalThis as typeof globalThis & { __lojaDb?: DatabaseSync };

function estoque(): number {
  return (db.prepare("SELECT estoque FROM variacoes WHERE id = ?").get(variacao) as { estoque: number }).estoque;
}

function evento(event: string, externalReference: string, token: string | null = TOKEN) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== null) headers["asaas-access-token"] = token;
  return new Request("http://localhost/api/loja/asaas", {
    method: "POST",
    headers,
    body: JSON.stringify({ event, payment: { id: "pay_1", status: "RECEIVED", externalReference } }),
  });
}

function pedidoComCobranca() {
  const p = criarPedido(
    db,
    { nome: "Ana", whatsapp: "5513999990000", aceitaMsgs: true, forma: "pix", itens: [{ variacaoId: variacao, qtd: 1 }] },
    new Date(),
  );
  salvarCobranca(db, p.id, { asaasId: "pay_1", invoiceUrl: "https://asaas.test/i/1", pixCopiaCola: "000201" });
  return p;
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "loja-webhook-"));
  g.__lojaDb?.close();
  delete g.__lojaDb;
  vi.stubEnv("DATA_DIR", dir);
  vi.stubEnv("LOJA_ASAAS_API_KEY", "chave-teste");
  vi.stubEnv("LOJA_ASAAS_URL", ASAAS);
  vi.stubEnv("ASAAS_WEBHOOK_TOKEN", TOKEN);
  statusPagamento = "CONFIRMED";
  fetchMock = vi.fn(
    async () =>
      new Response(JSON.stringify({ status: statusPagamento, netValue: 64.01 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(dispararCiclo).mockClear();
  vi.mocked(marcarPago).mockClear();
  db = getDb();
  const p = criarProduto(db, {
    nome: "Camiseta Caiçara",
    descricao: "",
    preco: 7000,
    precoPix: 6500,
    parcelasMax: 2,
    fotos: [],
    variacoes: [{ modelo: "Baby look", tamanho: "P", estoque: 1 }],
  });
  variacao = buscarPorId(db, p.id)!.variacoes[0].id;
});

afterEach(() => {
  g.__lojaDb?.close();
  delete g.__lojaDb;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("POST /api/loja/asaas", () => {
  it("sem token, token errado ou sem ASAAS_WEBHOOK_TOKEN no ambiente → 401", async () => {
    const p = pedidoComCobranca();
    const ref = `loja:${p.codigo}`;
    expect((await POST(evento("PAYMENT_CONFIRMED", ref, null))).status).toBe(401);
    expect((await POST(evento("PAYMENT_CONFIRMED", ref, "outro"))).status).toBe(401);
    expect((await POST(evento("PAYMENT_CONFIRMED", ref, `${TOKEN}x`))).status).toBe(401);
    vi.stubEnv("ASAAS_WEBHOOK_TOKEN", "");
    expect((await POST(evento("PAYMENT_CONFIRMED", ref, ""))).status).toBe(401);
    expect(buscarPorCodigo(db, p.codigo)!.status).toBe("aguardando");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("CONFIRMED duas vezes e depois RECEIVED → pago uma vez só (Review Focus 2)", async () => {
    const p = pedidoComCobranca();
    const ref = `loja:${p.codigo}`;
    expect((await POST(evento("PAYMENT_CONFIRMED", ref))).status).toBe(200);
    const pagoEm = buscarPorCodigo(db, p.codigo)!.pagoEm;
    expect((await POST(evento("PAYMENT_CONFIRMED", ref))).status).toBe(200);
    statusPagamento = "RECEIVED";
    expect((await POST(evento("PAYMENT_RECEIVED", ref))).status).toBe(200);

    const final = buscarPorCodigo(db, p.codigo)!;
    expect(final).toMatchObject({ status: "pago", liquido: 6401, pagoEm });
    const mudou = vi.mocked(marcarPago).mock.results.filter((r) => r.type === "return" && r.value.mudou);
    expect(mudou).toHaveLength(1);
    expect(estoque()).toBe(0);
    expect(dispararCiclo).toHaveBeenCalled();
    expect(db.prepare("SELECT COUNT(*) AS n FROM mensagens").get()).toEqual({ n: 0 });
  });

  it("não confia no corpo: Asaas diz que não pagou → continua aguardando", async () => {
    const p = pedidoComCobranca();
    statusPagamento = "PENDING";
    expect((await POST(evento("PAYMENT_RECEIVED", `loja:${p.codigo}`))).status).toBe(200);
    expect(buscarPorCodigo(db, p.codigo)!.status).toBe("aguardando");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("evento do Aulão Rosa → 200 sem tocar no banco nem no Asaas", async () => {
    const p = pedidoComCobranca();
    const r = await POST(evento("PAYMENT_RECEIVED", "aulao-rosa:5513999990000"));
    expect(r.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(marcarPago).not.toHaveBeenCalled();
    expect(buscarPorCodigo(db, p.codigo)!.status).toBe("aguardando");
  });

  it("outros eventos e código desconhecido → 200 sem marcar nada", async () => {
    const p = pedidoComCobranca();
    expect((await POST(evento("PAYMENT_CREATED", `loja:${p.codigo}`))).status).toBe(200);
    expect((await POST(evento("PAYMENT_RECEIVED", "loja:naoexiste"))).status).toBe(200);
    expect(marcarPago).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("corpo gigante em stream → 200 sem consultar nada", async () => {
    const pedaco = new TextEncoder().encode(" ".repeat(64 * 1024));
    let enviados = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(c) {
        if (enviados++ < 10) c.enqueue(pedaco);
        else c.close();
      },
    });
    const r = await POST(
      new Request("http://localhost/api/loja/asaas", {
        method: "POST",
        body: stream,
        headers: { "asaas-access-token": TOKEN },
        duplex: "half",
      } as RequestInit),
    );
    expect(r.status).toBe(200);
    expect(enviados).toBeLessThan(10);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Asaas fora na confirmação → 500 para o Asaas reenviar", async () => {
    const p = pedidoComCobranca();
    fetchMock.mockImplementation(async () => new Response("fora", { status: 503 }));
    expect((await POST(evento("PAYMENT_RECEIVED", `loja:${p.codigo}`))).status).toBe(500);
    expect(buscarPorCodigo(db, p.codigo)!.status).toBe("aguardando");
  });
});
