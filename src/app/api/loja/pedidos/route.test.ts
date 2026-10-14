import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/loja/verificador", () => ({ dispararCiclo: vi.fn() }));

import { GET as getFoto } from "@/app/api/loja/fotos/[arquivo]/route";
import { GET as getPedido, POST as postPedido } from "@/app/api/loja/pedidos/[codigo]/route";
import { POST } from "@/app/api/loja/pedidos/route";
import { getDb } from "@/lib/loja/db";
import { buscarPorCodigo, expirarVencidos } from "@/lib/loja/pedidos";
import { buscarPorId, criarProduto } from "@/lib/loja/produtos";
import { dispararCiclo } from "@/lib/loja/verificador";

const CPF = "529.982.247-25";
const ASAAS = "https://asaas.test/v3";

let dir: string;
let db: DatabaseSync;
let babyP: number; // estoque 1
let babyM: number; // estoque 5
let asaasFora: boolean;
let statusPagamento: string;
let chamadas: { metodo: string; url: string; corpo: string }[];
let falhar: (metodo: string, caminho: string) => boolean;

const g = globalThis as typeof globalThis & {
  __lojaDb?: DatabaseSync;
  __lojaLimiteIp?: unknown;
  __lojaUltimaConsulta?: unknown;
};

function estoque(id: number): number {
  return (db.prepare("SELECT estoque FROM variacoes WHERE id = ?").get(id) as { estoque: number }).estoque;
}

function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}

function fetchFalso(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = String(input);
  const metodo = init?.method ?? "GET";
  chamadas.push({ metodo, url, corpo: String(init?.body ?? "") });
  const caminho = url.slice(ASAAS.length);
  if (asaasFora || falhar(metodo, caminho)) return Promise.resolve(new Response("fora", { status: 503 }));
  if (metodo === "DELETE" && caminho.startsWith("/payments/")) return Promise.resolve(json({ deleted: true }));
  if (metodo === "POST" && caminho === "/customers") return Promise.resolve(json({ id: "cus_1" }));
  if (metodo === "POST" && caminho === "/payments") {
    const n = chamadas.filter((c) => c.url.endsWith("/payments") && c.metodo === "POST").length;
    return Promise.resolve(json({ id: `pay_${n}`, invoiceUrl: `https://asaas.test/i/${n}` }));
  }
  if (caminho.endsWith("/pixQrCode")) return Promise.resolve(json({ encodedImage: "QR", payload: "000201" }));
  if (metodo === "GET" && caminho.startsWith("/payments/")) {
    return Promise.resolve(json({ status: statusPagamento, netValue: 64.01 }));
  }
  return Promise.resolve(new Response("não esperado", { status: 500 }));
}

function req(url: string, corpo?: unknown, init: RequestInit = {}) {
  return new Request(`http://localhost${url}`, {
    method: corpo === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : typeof corpo === "string" ? corpo : JSON.stringify(corpo),
    ...init,
  });
}

const ctx = <T extends Record<string, string>>(params: T) => ({ params: Promise.resolve(params) });

function corpoPedido(extra: Record<string, unknown> = {}) {
  return {
    nome: "Ana Souza",
    whatsapp: "(13) 99999-0000",
    cpf: CPF,
    aceitaMsgs: true,
    forma: "pix",
    itens: [{ variacaoId: babyP, qtd: 1 }],
    site: "",
    ...extra,
  };
}

async function criar(extra: Record<string, unknown> = {}): Promise<string> {
  const r = await POST(req("/api/loja/pedidos", corpoPedido(extra)));
  expect(r.status).toBe(200);
  return ((await r.json()) as { codigo: string }).codigo;
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "loja-api-"));
  g.__lojaDb?.close();
  delete g.__lojaDb;
  vi.stubEnv("DATA_DIR", dir);
  vi.stubEnv("LOJA_ASAAS_API_KEY", "chave-teste");
  vi.stubEnv("LOJA_ASAAS_URL", ASAAS);
  vi.stubEnv("SITE_URL", "https://caicara.store");
  vi.stubGlobal("fetch", vi.fn(fetchFalso));
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.mocked(dispararCiclo).mockClear();
  asaasFora = false;
  falhar = () => false;
  delete g.__lojaLimiteIp;
  delete g.__lojaUltimaConsulta;
  statusPagamento = "PENDING";
  chamadas = [];
  db = getDb();
  const p = criarProduto(db, {
    nome: "Camiseta Caiçara",
    descricao: "",
    preco: 7000,
    precoPix: 6500,
    parcelasMax: 2,
    fotos: [],
    variacoes: [
      { modelo: "Baby look", tamanho: "P", estoque: 1 },
      { modelo: "Baby look", tamanho: "M", estoque: 5 },
    ],
  });
  [babyP, babyM] = buscarPorId(db, p.id)!.variacoes.map((v) => v.id);
});

afterEach(() => {
  g.__lojaDb?.close();
  delete g.__lojaDb;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("POST /api/loja/pedidos", () => {
  it("cria o pedido, gera o Pix, salva a cobrança e dispara o ciclo", async () => {
    const codigo = await criar();
    const p = buscarPorCodigo(db, codigo)!;
    expect(p).toMatchObject({ status: "aguardando", whatsapp: "5513999990000", total: 6500, asaasId: "pay_1" });
    expect(p.pixCopiaCola).toBe("000201");
    expect(estoque(babyP)).toBe(0);
    expect(dispararCiclo).toHaveBeenCalledTimes(1);
    for (const arquivo of fs.readdirSync(dir).filter((f) => f.startsWith("loja.db"))) {
      const bytes = fs.readFileSync(path.join(dir, arquivo));
      expect(bytes.includes("52998224725") || bytes.includes(CPF)).toBe(false);
    }
    expect(JSON.parse(chamadas[0].corpo).cpfCnpj).toBe("52998224725");
  });

  it("CPF inválido → 400, sem reservar nada", async () => {
    const r = await POST(req("/api/loja/pedidos", corpoPedido({ cpf: "111.111.111-11" })));
    expect(r.status).toBe(400);
    expect(((await r.json()) as { error: string }).error).toMatch(/CPF/);
    expect(estoque(babyP)).toBe(1);
    expect(chamadas).toHaveLength(0);
  });

  it("nome curto, WhatsApp ruim ou forma inválida → 400", async () => {
    for (const extra of [{ nome: "A" }, { nome: "x".repeat(81) }, { whatsapp: "123" }, { forma: "boleto" }]) {
      const r = await POST(req("/api/loja/pedidos", corpoPedido(extra)));
      expect(r.status).toBe(400);
    }
    expect(estoque(babyP)).toBe(1);
  });

  it("Asaas fora do ar → 502 e estoque devolvido", async () => {
    asaasFora = true;
    const r = await POST(req("/api/loja/pedidos", corpoPedido()));
    expect(r.status).toBe(502);
    expect(((await r.json()) as { error: string }).error).toBe("Não deu pra gerar o pagamento agora. Tenta de novo.");
    expect(estoque(babyP)).toBe(1);
    const status = db.prepare("SELECT status FROM pedidos").all() as { status: string }[];
    expect(status).toEqual([{ status: "cancelado" }]);
    expect(dispararCiclo).not.toHaveBeenCalled();
  });

  it("ErroLoja → 400 com a mensagem e o motivo", async () => {
    await criar();
    const r = await POST(req("/api/loja/pedidos", corpoPedido()));
    expect(r.status).toBe(400);
    expect(await r.json()).toMatchObject({ error: expect.stringMatching(/esgotou/), motivo: "estoque" });
  });

  it("campo-isca preenchido → 200 sem criar pedido", async () => {
    const r = await POST(req("/api/loja/pedidos", corpoPedido({ site: "http://spam" })));
    expect(r.status).toBe(200);
    expect(db.prepare("SELECT COUNT(*) AS n FROM pedidos").get()).toEqual({ n: 0 });
  });

  it("corpo maior que 20 KB → 413; JSON quebrado → 400", async () => {
    const grande = await POST(req("/api/loja/pedidos", corpoPedido({ lixo: "x".repeat(21 * 1024) })));
    expect(grande.status).toBe(413);
    const quebrado = await POST(req("/api/loja/pedidos", "{nome:"));
    expect(quebrado.status).toBe(400);
  });

  it("corpo em stream sem Content-Length acima de 20 KB → 413", async () => {
    const pedaco = new TextEncoder().encode("x".repeat(4096));
    let enviados = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(c) {
        if (enviados++ < 10) c.enqueue(pedaco);
        else c.close();
      },
    });
    const r = await POST(
      new Request("http://localhost/api/loja/pedidos", {
        method: "POST",
        body: stream,
        headers: { "Content-Type": "application/json" },
        duplex: "half",
      } as RequestInit),
    );
    expect(r.status).toBe(413);
    expect(enviados).toBeLessThan(10);
  });

  it("mesmo WhatsApp com 2 pedidos aguardando → 429 sem reservar", async () => {
    const corpo = { itens: [{ variacaoId: babyM, qtd: 1 }] };
    await criar(corpo);
    await criar(corpo);
    const r = await POST(req("/api/loja/pedidos", corpoPedido(corpo)));
    expect(r.status).toBe(429);
    expect(((await r.json()) as { error: string }).error).toBe(
      "Você já tem pedidos em aberto. Paga um deles ou espera a reserva vencer.",
    );
    expect(estoque(babyM)).toBe(3);
  });

  it("mais de 5 pedidos por hora do mesmo IP → 429; outro IP passa", async () => {
    const ip = (v: string) => ({ headers: { "Content-Type": "application/json", "x-forwarded-for": v } });
    for (let i = 0; i < 5; i++) {
      const corpo = corpoPedido({ whatsapp: `(13) 99999-000${i}`, itens: [{ variacaoId: babyM, qtd: 1 }] });
      expect((await POST(req("/api/loja/pedidos", corpo, ip("1.2.3.4, 10.0.0.1")))).status).toBe(200);
    }
    const sexto = corpoPedido({ whatsapp: "(13) 99999-0009", itens: [{ variacaoId: babyP, qtd: 1 }] });
    const r = await POST(req("/api/loja/pedidos", sexto, ip("1.2.3.4")));
    expect(r.status).toBe(429);
    expect(((await r.json()) as { error: string }).error).toBe("Muitas tentativas. Tenta de novo daqui a pouco.");
    expect(estoque(babyP)).toBe(1);
    expect((await POST(req("/api/loja/pedidos", sexto, ip("5.6.7.8")))).status).toBe(200);
  });

  it("QR do Pix falhou depois do pagamento criado → pedido segue com a fatura", async () => {
    falhar = (_m, caminho) => caminho.endsWith("/pixQrCode");
    const codigo = await criar();
    expect(buscarPorCodigo(db, codigo)!).toMatchObject({
      status: "aguardando",
      asaasId: "pay_1",
      pixQr: null,
      pixCopiaCola: null,
      invoiceUrl: "https://asaas.test/i/1",
    });
    expect(estoque(babyP)).toBe(0);
  });

  it("Asaas não configurado → 503 sem reservar", async () => {
    vi.stubEnv("LOJA_ASAAS_API_KEY", "");
    const r = await POST(req("/api/loja/pedidos", corpoPedido()));
    expect(r.status).toBe(503);
    expect(estoque(babyP)).toBe(1);
  });
});

describe("GET /api/loja/pedidos/[codigo]", () => {
  it("devolve só o necessário para a tela, sem CPF nem WhatsApp", async () => {
    const codigo = await criar({ itens: [{ variacaoId: babyM, qtd: 2 }] });
    const r = await getPedido(req(`/api/loja/pedidos/${codigo}`), ctx({ codigo }));
    expect(r.status).toBe(200);
    const corpo = (await r.json()) as Record<string, unknown>;
    expect(Object.keys(corpo).sort()).toEqual(
      ["forma", "invoiceUrl", "itens", "pixCopiaCola", "pixQr", "reservadoAte", "status", "total"].sort(),
    );
    expect(corpo).toMatchObject({
      status: "aguardando",
      total: 13000,
      forma: "pix",
      pixCopiaCola: "000201",
      itens: [{ descricao: "Camiseta Caiçara · Baby look M", qtd: 2, precoUnit: 6500 }],
    });
    const texto = JSON.stringify(corpo);
    expect(texto).not.toMatch(/99999|52998224725|529\.982/);
  });

  it("aguardando com cobrança: consulta o Asaas e marca pago na hora", async () => {
    const codigo = await criar();
    statusPagamento = "RECEIVED";
    const r = await getPedido(req(`/api/loja/pedidos/${codigo}`), ctx({ codigo }));
    expect(((await r.json()) as { status: string }).status).toBe("pago");
    expect(buscarPorCodigo(db, codigo)!).toMatchObject({ status: "pago", liquido: 6401 });
  });

  it("consulta o Asaas no máximo 1 vez a cada 20 s por código", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-14T15:00:00.000Z"));
    const codigo = await criar();
    const consultas = () => chamadas.filter((c) => c.metodo === "GET" && c.url.endsWith("/payments/pay_1")).length;
    const ver = async () =>
      ((await (await getPedido(req(`/api/loja/pedidos/${codigo}`), ctx({ codigo }))).json()) as { status: string })
        .status;
    expect(await ver()).toBe("aguardando");
    expect(consultas()).toBe(1);
    statusPagamento = "RECEIVED";
    vi.setSystemTime(new Date("2026-10-14T15:00:19.000Z"));
    expect(await ver()).toBe("aguardando");
    expect(consultas()).toBe(1);
    vi.setSystemTime(new Date("2026-10-14T15:00:21.000Z"));
    expect(await ver()).toBe("pago");
    expect(consultas()).toBe(2);
  });

  it("Asaas fora na consulta → responde o status atual mesmo assim", async () => {
    const codigo = await criar();
    asaasFora = true;
    const r = await getPedido(req(`/api/loja/pedidos/${codigo}`), ctx({ codigo }));
    expect(r.status).toBe(200);
    expect(((await r.json()) as { status: string }).status).toBe("aguardando");
  });

  it("código desconhecido ou malformado → 404", async () => {
    for (const codigo of ["AAAAAAAAAAAAAAAA", "../../etc", "x"]) {
      const r = await getPedido(req(`/api/loja/pedidos/x`), ctx({ codigo }));
      expect(r.status).toBe(404);
    }
  });
});

describe("POST /api/loja/pedidos/[codigo] reativar", () => {
  async function criarExpirado(): Promise<string> {
    const codigo = await criar();
    expirarVencidos(db, new Date(Date.now() + 2 * 60 * 60 * 1000));
    expect(buscarPorCodigo(db, codigo)!.status).toBe("expirado");
    expect(estoque(babyP)).toBe(1);
    return codigo;
  }

  const reativarReq = (codigo: string) =>
    postPedido(req(`/api/loja/pedidos/${codigo}`, { acao: "reativar", cpf: CPF }), ctx({ codigo }));

  it("reserva de novo e gera cobrança nova, cancelando a antiga antes", async () => {
    const codigo = await criarExpirado();
    const r = await reativarReq(codigo);
    expect(r.status).toBe(200);
    const iDelete = chamadas.findIndex((c) => c.metodo === "DELETE" && c.url.endsWith("/payments/pay_1"));
    const iCliente = chamadas.findIndex((c, i) => i > 0 && c.url.endsWith("/customers"));
    expect(iDelete).toBeGreaterThan(-1);
    expect(iCliente).toBeGreaterThan(iDelete);
    expect(buscarPorCodigo(db, codigo)!).toMatchObject({ status: "aguardando", asaasId: "pay_2" });
    expect(estoque(babyP)).toBe(0);
  });

  it("cancelar a antiga falhou mas ela foi paga → marca pago, sem cobrança nova", async () => {
    const codigo = await criarExpirado();
    falhar = (metodo) => metodo === "DELETE";
    statusPagamento = "RECEIVED";
    const antes = chamadas.filter((c) => c.url.endsWith("/customers")).length;
    const r = await reativarReq(codigo);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ codigo });
    expect(buscarPorCodigo(db, codigo)!).toMatchObject({ status: "pago", asaasId: "pay_1" });
    expect(chamadas.filter((c) => c.url.endsWith("/customers")).length).toBe(antes);
    expect(estoque(babyP)).toBe(0);
  });

  it("cancelar e consultar a antiga falharam → 502 sem reativar", async () => {
    const codigo = await criarExpirado();
    falhar = (metodo, caminho) => metodo === "DELETE" || caminho.startsWith("/payments/");
    const r = await reativarReq(codigo);
    expect(r.status).toBe(502);
    expect(buscarPorCodigo(db, codigo)!.status).toBe("expirado");
    expect(estoque(babyP)).toBe(1);
  });

  it("pedido ainda aguardando → 400 sem cancelar a cobrança dele", async () => {
    const codigo = await criar();
    const r = await reativarReq(codigo);
    expect(r.status).toBe(400);
    expect(chamadas.some((c) => c.metodo === "DELETE")).toBe(false);
    expect(buscarPorCodigo(db, codigo)!).toMatchObject({ status: "aguardando", asaasId: "pay_1" });
  });

  it("mesmo WhatsApp já com 2 pedidos aguardando → 429 sem reativar", async () => {
    const codigo = await criarExpirado();
    await criar({ itens: [{ variacaoId: babyM, qtd: 1 }] });
    await criar({ itens: [{ variacaoId: babyM, qtd: 1 }] });
    const r = await reativarReq(codigo);
    expect(r.status).toBe(429);
    expect(buscarPorCodigo(db, codigo)!.status).toBe("expirado");
  });

  it("sem estoque → 400 com motivo estoque, sem cobrar", async () => {
    const codigo = await criarExpirado();
    await criar(); // outra pessoa levou a última
    const clientes = () => chamadas.filter((c) => c.metodo === "POST" && c.url.endsWith("/customers")).length;
    const antes = clientes();
    const r = await postPedido(req(`/api/loja/pedidos/${codigo}`, { acao: "reativar", cpf: CPF }), ctx({ codigo }));
    expect(r.status).toBe(400);
    expect(((await r.json()) as { motivo: string }).motivo).toBe("estoque");
    expect(clientes()).toBe(antes);
  });

  it("cobrança nova falhou → 502, volta para expirado e devolve a peça", async () => {
    const codigo = await criarExpirado();
    falhar = (metodo, caminho) => metodo === "POST" && caminho === "/customers";
    const r = await postPedido(req(`/api/loja/pedidos/${codigo}`, { acao: "reativar", cpf: CPF }), ctx({ codigo }));
    expect(r.status).toBe(502);
    expect(buscarPorCodigo(db, codigo)!.status).toBe("expirado");
    expect(estoque(babyP)).toBe(1);
  });

  it("CPF inválido → 400; ação desconhecida → 400; código desconhecido → 404", async () => {
    const codigo = await criarExpirado();
    const semCpf = await postPedido(req(`/api/loja/pedidos/${codigo}`, { acao: "reativar", cpf: "1" }), ctx({ codigo }));
    expect(semCpf.status).toBe(400);
    const outra = await postPedido(req(`/api/loja/pedidos/${codigo}`, { acao: "pagar", cpf: CPF }), ctx({ codigo }));
    expect(outra.status).toBe(400);
    const nada = await postPedido(
      req(`/api/loja/pedidos/x`, { acao: "reativar", cpf: CPF }),
      ctx({ codigo: "AAAAAAAAAAAAAAAA" }),
    );
    expect(nada.status).toBe(404);
    expect(buscarPorCodigo(db, codigo)!.status).toBe("expirado");
  });
});

describe("GET /api/loja/fotos/[arquivo]", () => {
  beforeEach(() => {
    fs.mkdirSync(path.join(dir, "loja", "fotos"), { recursive: true });
    fs.writeFileSync(path.join(dir, "loja", "fotos", "camiseta-1.webp"), Buffer.from("RIFFxxxxWEBP"));
  });

  it("serve a foto com tipo e cache longo", async () => {
    const r = await getFoto(req("/api/loja/fotos/camiseta-1.webp"), ctx({ arquivo: "camiseta-1.webp" }));
    expect(r.status).toBe(200);
    expect(r.headers.get("Content-Type")).toBe("image/webp");
    expect(r.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(Buffer.from(await r.arrayBuffer()).toString()).toBe("RIFFxxxxWEBP");
  });

  it("path traversal, nome fora do padrão ou inexistente → 404", async () => {
    for (const arquivo of ["../loja.db", "..%2Floja.db", "loja.db", "Camiseta.webp", "x.svg", "nao-existe.png"]) {
      const r = await getFoto(req("/api/loja/fotos/x"), ctx({ arquivo }));
      expect(r.status).toBe(404);
    }
  });
});
