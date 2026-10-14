import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openDb } from "@/lib/loja/db";
import { buscarPorCodigo, criarPedido, expirarVencidos, salvarCobranca, type PedidoComItens } from "@/lib/loja/pedidos";
import { buscarPorId, criarProduto } from "@/lib/loja/produtos";
import type { Pedido } from "@/lib/loja/tipos";
import { rodarCiclo, type DepsCiclo } from "@/lib/loja/verificador";

type Db = ReturnType<typeof openDb>;

// 15:00 UTC = 12:00 em São Paulo (dentro da janela)
const T0 = new Date("2026-10-14T15:00:00.000Z");
const min = (n: number) => new Date(T0.getTime() + n * 60_000);
const DONO = "5513900000000";

let db: Db;
let babyP: number;
let babyM: number;
let envios: { numero: string; texto: string }[];
let deps: DepsCiclo & {
  enviarWhatsapp: ReturnType<typeof vi.fn>;
  consultarPagamento: ReturnType<typeof vi.fn>;
  cancelarCobranca: ReturnType<typeof vi.fn>;
};

function pedido(variacaoId: number, whatsapp = "5513999990000", agora = T0, aceitaMsgs = false): PedidoComItens {
  const p = criarPedido(db, { nome: "Ana", whatsapp, aceitaMsgs, forma: "pix", itens: [{ variacaoId, qtd: 1 }] }, agora);
  salvarCobranca(db, p.id, { asaasId: `pay_${p.id}`, invoiceUrl: "https://asaas/x", pixCopiaCola: "000201" });
  return p;
}

function msgs(pedidoId: number) {
  return db
    .prepare("SELECT tipo, tentativas, enviada_em, erro FROM mensagens WHERE pedido_id = ? ORDER BY tipo")
    .all(pedidoId) as { tipo: string; tentativas: number; enviada_em: string | null; erro: string | null }[];
}

function enviosDo(tipoTexto: RegExp) {
  return envios.filter((e) => tipoTexto.test(e.texto));
}

beforeEach(() => {
  vi.stubEnv("AVISO_WHATSAPP", DONO);
  vi.stubEnv("SITE_URL", "https://caicara.store");
  vi.spyOn(console, "error").mockImplementation(() => {});
  db = openDb(":memory:");
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
  envios = [];
  deps = {
    enviarWhatsapp: vi.fn(async (numero: string, texto: string) => {
      envios.push({ numero, texto });
      return true;
    }),
    consultarPagamento: vi.fn(async () => ({ pago: false, liquido: null })),
    cancelarCobranca: vi.fn(async () => {}),
  };
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("rodarCiclo", () => {
  it("expira a reserva vencida, devolve o estoque e cancela a cobrança", async () => {
    const p = pedido(babyP);
    await rodarCiclo(db, min(61), deps);
    expect(buscarPorCodigo(db, p.codigo)!.status).toBe("expirado");
    expect(deps.cancelarCobranca).toHaveBeenCalledTimes(1);
    expect((deps.cancelarCobranca.mock.calls[0][0] as Pedido).codigo).toBe(p.codigo);
    const estoque = db.prepare("SELECT estoque FROM variacoes WHERE id = ?").get(babyP) as { estoque: number };
    expect(estoque.estoque).toBe(1);
  });

  it("recebido sai logo no primeiro ciclo, uma vez só", async () => {
    const p = pedido(babyM);
    await rodarCiclo(db, min(2), deps);
    await rodarCiclo(db, min(7), deps);
    expect(envios).toHaveLength(1);
    expect(envios[0]).toMatchObject({ numero: "5513999990000" });
    expect(envios[0].texto).toContain(`https://caicara.store/loja/pedido/${p.codigo}`);
    expect(msgs(p.id)).toEqual([expect.objectContaining({ tipo: "recebido", tentativas: 1 })]);
  });

  it("pagamento confirmado gera exatamente um pago e um aviso_venda", async () => {
    const p = pedido(babyM);
    deps.consultarPagamento.mockResolvedValue({ pago: true, liquido: 6400 });
    await rodarCiclo(db, min(5), deps);
    await rodarCiclo(db, min(10), deps);
    await rodarCiclo(db, min(15), deps);
    expect(buscarPorCodigo(db, p.codigo)).toMatchObject({ status: "pago", liquido: 6400 });
    expect(enviosDo(/^Pagamento confirmado/)).toEqual([expect.objectContaining({ numero: "5513999990000" })]);
    expect(enviosDo(/^💰 Venda paga/)).toEqual([expect.objectContaining({ numero: DONO })]);
    expect(envios).toHaveLength(2);
  });

  it("dois ciclos ao mesmo tempo (webhook + intervalo) não mandam a mesma mensagem duas vezes", async () => {
    const p = pedido(babyM);
    deps.consultarPagamento.mockResolvedValue({ pago: true, liquido: 6400 });
    deps.enviarWhatsapp.mockImplementation(async (numero: string, texto: string) => {
      await new Promise((r) => setTimeout(r, 5));
      envios.push({ numero, texto });
      return true;
    });
    await Promise.all([rodarCiclo(db, min(5), deps), rodarCiclo(db, min(5), deps), rodarCiclo(db, min(5), deps)]);
    expect(envios).toHaveLength(2);
    expect(msgs(p.id).map((m) => m.tipo)).toEqual(["aviso_venda", "pago"]);
  });

  it("envio que falha 3 vezes para de tentar e guarda o erro", async () => {
    const p = pedido(babyM);
    deps.enviarWhatsapp.mockResolvedValue(false);
    for (let i = 0; i < 5; i++) await rodarCiclo(db, min(2 + i * 5), deps);
    expect(deps.enviarWhatsapp).toHaveBeenCalledTimes(3);
    expect(msgs(p.id)).toEqual([expect.objectContaining({ tipo: "recebido", tentativas: 3, enviada_em: null })]);
    expect(msgs(p.id)[0].erro).toBeTruthy();
  });

  it("erro num pedido não para os outros", async () => {
    const a = pedido(babyM, "5513911111111");
    const b = pedido(babyM, "5513922222222");
    deps.consultarPagamento.mockImplementation(async (p: Pedido) => {
      if (p.id === a.id) throw new Error("Asaas fora do ar");
      return { pago: true, liquido: 6400 };
    });
    deps.enviarWhatsapp.mockImplementation(async (numero: string, texto: string) => {
      if (numero === "5513911111111") throw new Error("Evolution caiu");
      envios.push({ numero, texto });
      return true;
    });
    await rodarCiclo(db, min(5), deps);
    expect(buscarPorCodigo(db, a.codigo)!.status).toBe("aguardando");
    expect(buscarPorCodigo(db, b.codigo)!.status).toBe("pago");
    expect(enviosDo(/^Pagamento confirmado/)).toHaveLength(1);
    expect(msgs(a.id)).toEqual([expect.objectContaining({ tipo: "recebido", tentativas: 1, enviada_em: null })]);
  });

  it("lembrete de 1h só para quem aceitou, e não se o mesmo WhatsApp pagou outro pedido depois", async () => {
    const sim = pedido(babyM, "5513933333333", T0, true);
    const nao = pedido(babyM, "5513944444444", T0, false);
    const pagou = pedido(babyM, "5513955555555", T0, true);
    const depois = pedido(babyM, "5513955555555", min(30), false);
    deps.consultarPagamento.mockImplementation(async (p: Pedido) => ({ pago: p.id === depois.id, liquido: 6400 }));
    await rodarCiclo(db, min(31), deps);
    envios = [];
    await rodarCiclo(db, min(65), deps);
    const lembretes = enviosDo(/ainda tá em aberto/).map((e) => e.numero);
    expect(lembretes).toEqual(["5513933333333"]);
    expect(msgs(nao.id).map((m) => m.tipo)).toEqual(["recebido"]);
    expect(msgs(pagou.id).map((m) => m.tipo)).toEqual(["recebido"]);
    expect(msgs(sim.id).map((m) => m.tipo)).toEqual(["lembrete1h", "recebido"]);
  });

  it("lembrete não vai se a peça esgotou", async () => {
    const p = pedido(babyP, "5513933333333", T0, true);
    await rodarCiclo(db, min(5), deps);
    expirarVencidos(db, min(60)); // expira entre ciclos e devolve a P
    pedido(babyP, "5513966666666", min(62)); // outra pessoa pega a última P
    await rodarCiclo(db, min(65), deps);
    expect(msgs(p.id).map((m) => m.tipo)).toEqual(["recebido"]);
  });
});
