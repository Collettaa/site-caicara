import { beforeEach, describe, expect, it } from "vitest";
import { openDb } from "@/lib/loja/db";
import {
  abertosComCobranca,
  buscarPorCodigo,
  cancelar,
  criarPedido,
  ErroLoja,
  expirarVencidos,
  listarPorStatus,
  marcarEntregue,
  marcarPago,
  reativar,
  salvarCobranca,
  vendaBalcao,
  voltarParaExpirado,
} from "@/lib/loja/pedidos";
import { atualizarProduto, buscarPorId, criarProduto } from "@/lib/loja/produtos";

type Db = ReturnType<typeof openDb>;

const T0 = new Date("2026-10-14T15:00:00.000Z");
const min = (n: number) => new Date(T0.getTime() + n * 60_000);

let db: Db;
let produtoId: number;
let babyP: number; // estoque 1
let babyM: number; // estoque 5

function estoque(variacaoId: number): number {
  return (db.prepare("SELECT estoque FROM variacoes WHERE id = ?").get(variacaoId) as { estoque: number }).estoque;
}

function pedido(variacaoId: number, qtd = 1, forma: "pix" | "cartao1" | "cartao2" = "pix", agora = T0) {
  return criarPedido(
    db,
    { nome: "Ana", whatsapp: "5513999990000", aceitaMsgs: true, forma, itens: [{ variacaoId, qtd }] },
    agora,
  );
}

function pegaErro(fn: () => unknown): ErroLoja {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ErroLoja);
    return e as ErroLoja;
  }
  throw new Error("não lançou");
}

beforeEach(() => {
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
  produtoId = p.id;
  [babyP, babyM] = buscarPorId(db, p.id)!.variacoes.map((v) => v.id);
});

describe("criarPedido", () => {
  it("baixa o estoque e grava o pedido aguardando com reserva de 1h", () => {
    const p = pedido(babyP);
    expect(estoque(babyP)).toBe(0);
    expect(p).toMatchObject({
      status: "aguardando",
      origem: "site",
      forma: "pix",
      total: 6500,
      aceitaMsgs: true,
      reservadoAte: min(60).toISOString(),
      criadoEm: T0.toISOString(),
    });
    expect(p.codigo).toMatch(/^[A-Za-z0-9_-]{16}$/);
    expect(p.itens).toEqual([
      expect.objectContaining({ variacaoId: babyP, qtd: 1, precoUnit: 6500, descricao: "Camiseta Caiçara · Baby look P" }),
    ]);
  });

  it("duas pessoas, última peça: o segundo falha e o estoque fica 0 (Review Focus 1)", () => {
    pedido(babyP);
    const e = pegaErro(() => pedido(babyP));
    expect(e.codigo).toBe("estoque");
    expect(e.message).toContain("esgotou");
    expect(estoque(babyP)).toBe(0);
    expect(listarPorStatus(db, ["aguardando"])).toHaveLength(1);
  });

  it("um item sem estoque desfaz a baixa dos outros", () => {
    const e = pegaErro(() =>
      criarPedido(
        db,
        {
          nome: "Ana",
          whatsapp: "5513999990000",
          aceitaMsgs: false,
          forma: "pix",
          itens: [
            { variacaoId: babyM, qtd: 2 },
            { variacaoId: babyP, qtd: 2 },
          ],
        },
        T0,
      ),
    );
    expect(e.codigo).toBe("estoque");
    expect(estoque(babyM)).toBe(5);
    expect(estoque(babyP)).toBe(1);
  });

  it("qtd 6 → limite; somando linhas repetidas também conta", () => {
    expect(pegaErro(() => pedido(babyM, 6)).codigo).toBe("limite");
    expect(pegaErro(() => pedido(babyM, 0)).codigo).toBe("limite");
    const e = pegaErro(() =>
      criarPedido(
        db,
        {
          nome: "Ana",
          whatsapp: "5513999990000",
          aceitaMsgs: false,
          forma: "pix",
          itens: [
            { variacaoId: babyM, qtd: 3 },
            { variacaoId: babyM, qtd: 3 },
          ],
        },
        T0,
      ),
    );
    expect(e.codigo).toBe("limite");
    expect(estoque(babyM)).toBe(5);
  });

  it("variação inativa, produto oculto ou variação apagada → inativo (Review Focus 3)", () => {
    db.prepare("UPDATE variacoes SET ativo = 0 WHERE id = ?").run(babyM);
    const e1 = pegaErro(() => pedido(babyM));
    expect(e1.codigo).toBe("inativo");
    expect(e1.message).toBe("Camiseta Caiçara · Baby look M saiu da loja. Tira do carrinho e tenta de novo.");
    db.prepare("UPDATE produtos SET ativo = 0 WHERE id = ?").run(produtoId);
    const e2 = pegaErro(() => pedido(babyP));
    expect(e2.codigo).toBe("inativo");
    expect(e2.message).toBe("Camiseta Caiçara · Baby look P saiu da loja. Tira do carrinho e tenta de novo.");
    const e3 = pegaErro(() => pedido(9999));
    expect(e3.codigo).toBe("inativo");
    expect(e3.message).toBe("Um item do carrinho saiu da loja. Tira ele e tenta de novo.");
    expect(estoque(babyP)).toBe(1);
  });

  it("cartao2 num produto de parcelasMax 1 → parcelas", () => {
    atualizarProduto(db, produtoId, { parcelasMax: 1 });
    expect(pegaErro(() => pedido(babyM, 1, "cartao2")).codigo).toBe("parcelas");
    expect(estoque(babyM)).toBe(5);
    expect(pedido(babyM, 1, "cartao1").total).toBe(7000);
  });

  it("preço calculado no servidor; mudar o preço depois não mexe no pedido (Review Focus 3)", () => {
    const p = pedido(babyM, 2, "pix");
    expect(p.total).toBe(13000);
    expect(pedido(babyM, 2, "cartao2").total).toBe(14000);
    atualizarProduto(db, produtoId, { preco: 9000, precoPix: 8500 });
    const salvo = buscarPorCodigo(db, p.codigo)!;
    expect(salvo.total).toBe(13000);
    expect(salvo.itens[0].precoUnit).toBe(6500);
  });

  it("preço enviado pelo cliente é ignorado", () => {
    const entrada = {
      nome: "Ana",
      whatsapp: "5513999990000",
      aceitaMsgs: false,
      forma: "pix" as const,
      itens: [{ variacaoId: babyM, qtd: 1, preco: 1, precoUnit: 1 }],
      total: 1,
    };
    expect(criarPedido(db, entrada, T0).total).toBe(6500);
  });
});

describe("expirarVencidos", () => {
  it("em +59min não expira; em +60min expira e devolve o estoque", () => {
    const p = pedido(babyP);
    expect(expirarVencidos(db, min(59))).toEqual([]);
    expect(estoque(babyP)).toBe(0);
    const expirados = expirarVencidos(db, min(60));
    expect(expirados.map((x) => [x.codigo, x.status])).toEqual([[p.codigo, "expirado"]]);
    expect(estoque(babyP)).toBe(1);
    expect(expirarVencidos(db, min(120))).toEqual([]);
    expect(estoque(babyP)).toBe(1);
  });
});

describe("marcarPago", () => {
  it("aguardando → pago; segunda vez mudou false", () => {
    const p = pedido(babyP);
    const a = marcarPago(db, p.codigo, 6401, min(10));
    expect(a.mudou).toBe(true);
    expect(a.pedido).toMatchObject({ status: "pago", liquido: 6401, pagoEm: min(10).toISOString() });
    const b = marcarPago(db, p.codigo, 6401, min(11));
    expect(b.mudou).toBe(false);
    expect(b.pedido.pagoEm).toBe(min(10).toISOString());
    expect(estoque(babyP)).toBe(0);
  });

  it("expirou, outra pessoa levou a peça, pagamento chega → pago_sem_peca e estoque 0 (Review Focus 5)", () => {
    const primeiro = pedido(babyP);
    expirarVencidos(db, min(60));
    pedido(babyP, 1, "pix", min(61));
    expect(estoque(babyP)).toBe(0);
    const r = marcarPago(db, primeiro.codigo, 6401, min(70));
    expect(r.mudou).toBe(true);
    expect(r.pedido.status).toBe("pago_sem_peca");
    expect(r.pedido.pagoEm).toBe(min(70).toISOString());
    expect(estoque(babyP)).toBe(0);
    expect(marcarPago(db, primeiro.codigo, 6401, min(71)).mudou).toBe(false);
  });

  it("expirou mas a peça ainda existe → pago e estoque baixa de novo", () => {
    const p = pedido(babyP);
    expirarVencidos(db, min(60));
    expect(estoque(babyP)).toBe(1);
    const r = marcarPago(db, p.codigo, null, min(70));
    expect(r.pedido.status).toBe("pago");
    expect(estoque(babyP)).toBe(0);
  });

  it("pedido com dois itens e um faltando → pago_sem_peca sem baixar nenhum", () => {
    const p = criarPedido(
      db,
      {
        nome: "Ana",
        whatsapp: "5513999990000",
        aceitaMsgs: false,
        forma: "pix",
        itens: [
          { variacaoId: babyM, qtd: 1 },
          { variacaoId: babyP, qtd: 1 },
        ],
      },
      T0,
    );
    expirarVencidos(db, min(60));
    pedido(babyP, 1, "pix", min(61));
    expect(estoque(babyM)).toBe(5);
    expect(marcarPago(db, p.codigo, null, min(70)).pedido.status).toBe("pago_sem_peca");
    expect(estoque(babyM)).toBe(5);
    expect(estoque(babyP)).toBe(0);
  });

  it("pago → dono cancela → pagamento chega de novo: mudou false, continua cancelado", () => {
    const p = pedido(babyP, 1, "cartao1");
    marcarPago(db, p.codigo, 6800, min(5));
    cancelar(db, p.id);
    expect(estoque(babyP)).toBe(1);
    const r = marcarPago(db, p.codigo, 6800, min(10));
    expect(r.mudou).toBe(false);
    expect(r.pedido.status).toBe("cancelado");
    expect(estoque(babyP)).toBe(1);
  });

  it("cancelado antes de pagar e o pagamento chega → pago", () => {
    const p = pedido(babyP);
    cancelar(db, p.id);
    const r = marcarPago(db, p.codigo, null, min(10));
    expect(r).toMatchObject({ mudou: true, pedido: { status: "pago" } });
    expect(estoque(babyP)).toBe(0);
  });

  it("código desconhecido → nao_encontrado", () => {
    expect(pegaErro(() => marcarPago(db, "xxx", null, T0)).codigo).toBe("nao_encontrado");
  });
});

describe("voltarParaExpirado", () => {
  it("desfaz a reativação sem cobrança: expirado de novo e estoque devolvido", () => {
    const p = pedido(babyP);
    expirarVencidos(db, min(60));
    reativar(db, p.codigo, min(90));
    expect(estoque(babyP)).toBe(0);
    expect(voltarParaExpirado(db, p.id).status).toBe("expirado");
    expect(estoque(babyP)).toBe(1);
  });

  it("não mexe em pedido com cobrança ou fora de aguardando", () => {
    const p = pedido(babyM);
    salvarCobranca(db, p.id, { asaasId: "pay_1", invoiceUrl: "https://x" });
    expect(voltarParaExpirado(db, p.id).status).toBe("aguardando");
    expect(estoque(babyM)).toBe(4);
    marcarPago(db, p.codigo, null, min(5));
    expect(voltarParaExpirado(db, p.id).status).toBe("pago");
    expect(estoque(babyM)).toBe(4);
  });
});

describe("reativar", () => {
  it("sem estoque → estoque; continua expirado", () => {
    const p = pedido(babyP);
    expirarVencidos(db, min(60));
    pedido(babyP, 1, "pix", min(61));
    expect(pegaErro(() => reativar(db, p.codigo, min(90))).codigo).toBe("estoque");
    expect(buscarPorCodigo(db, p.codigo)!.status).toBe("expirado");
    expect(estoque(babyP)).toBe(0);
  });

  it("com estoque → aguardando, reserva nova e cobrança antiga limpa", () => {
    const p = pedido(babyP);
    salvarCobranca(db, p.id, { asaasId: "pay_1", pixQr: "qr", pixCopiaCola: "cc", invoiceUrl: "https://x" });
    expirarVencidos(db, min(60));
    const r = reativar(db, p.codigo, min(90));
    expect(r).toMatchObject({
      status: "aguardando",
      reservadoAte: min(150).toISOString(),
      asaasId: null,
      asaasParcelamentoId: null,
      pixQr: null,
      pixCopiaCola: null,
      invoiceUrl: null,
      total: 6500,
    });
    expect(estoque(babyP)).toBe(0);
  });

  it("só de expirado", () => {
    const p = pedido(babyM);
    expect(pegaErro(() => reativar(db, p.codigo, min(5))).codigo).toBe("status");
  });
});

describe("entrega, cancelamento e balcão", () => {
  it("marcarEntregue de pedido pago", () => {
    const p = pedido(babyM);
    marcarPago(db, p.codigo, null, min(5));
    const e = marcarEntregue(db, p.id, min(60 * 24));
    expect(e.ajusteManual).toBe(false);
    expect(e.pedido).toMatchObject({ status: "entregue", entregueEm: min(60 * 24).toISOString() });
    expect(estoque(babyM)).toBe(4);
  });

  it("marcarEntregue de pago_sem_peca com a peça de volta → baixa o estoque, sem ajuste manual", () => {
    const p = pedido(babyP);
    expirarVencidos(db, min(60));
    const outro = pedido(babyP, 1, "pix", min(61));
    marcarPago(db, p.codigo, null, min(70));
    cancelar(db, outro.id); // peça volta ao estoque
    expect(estoque(babyP)).toBe(1);
    const e = marcarEntregue(db, p.id, min(80));
    expect(e).toMatchObject({ ajusteManual: false, pedido: { status: "entregue" } });
    expect(estoque(babyP)).toBe(0);
  });

  it("marcarEntregue de pago_sem_peca sem estoque → entrega e pede ajuste manual", () => {
    const p = pedido(babyP);
    expirarVencidos(db, min(60));
    pedido(babyP, 1, "pix", min(61));
    marcarPago(db, p.codigo, null, min(70));
    const e = marcarEntregue(db, p.id, min(80));
    expect(e).toMatchObject({ ajusteManual: true, pedido: { status: "entregue" } });
    expect(estoque(babyP)).toBe(0);
    expect(estoque(babyM)).toBe(5);
  });

  it("marcarEntregue de pedido aguardando → status", () => {
    const p = pedido(babyM);
    expect(pegaErro(() => marcarEntregue(db, p.id, min(5))).codigo).toBe("status");
  });

  it("vendaBalcao → entregue, origem balcao, estoque baixa", () => {
    const v = vendaBalcao(db, { itens: [{ variacaoId: babyM, qtd: 2 }], forma: "balcao_pix" }, T0);
    expect(v).toMatchObject({
      status: "entregue",
      origem: "balcao",
      forma: "balcao_pix",
      total: 13000,
      liquido: 13000,
      pagoEm: T0.toISOString(),
      entregueEm: T0.toISOString(),
    });
    expect(estoque(babyM)).toBe(3);
    expect(buscarPorCodigo(db, v.codigo)!.itens[0].descricao).toBe("Camiseta Caiçara · Baby look M");
  });

  it("vendaBalcao sem estoque → estoque, nada gravado", () => {
    pedido(babyP);
    expect(pegaErro(() => vendaBalcao(db, { itens: [{ variacaoId: babyP, qtd: 1 }], forma: "balcao_dinheiro" }, T0)).codigo).toBe(
      "estoque",
    );
    expect(listarPorStatus(db, ["entregue"])).toEqual([]);
  });

  it("cancelar pedido pago devolve o estoque", () => {
    const p = pedido(babyP);
    marcarPago(db, p.codigo, null, min(5));
    expect(cancelar(db, p.id).status).toBe("cancelado");
    expect(estoque(babyP)).toBe(1);
  });

  it("cancelar pedido aguardando devolve; cancelar de novo não devolve outra vez", () => {
    const p = pedido(babyM, 2);
    cancelar(db, p.id);
    expect(estoque(babyM)).toBe(5);
    cancelar(db, p.id);
    expect(estoque(babyM)).toBe(5);
  });

  it("cancelar pedido entregue → ErroLoja status, nada muda", () => {
    const v = vendaBalcao(db, { itens: [{ variacaoId: babyM, qtd: 1 }], forma: "balcao_dinheiro" }, T0);
    const antes = estoque(babyM);
    expect(pegaErro(() => cancelar(db, v.id)).codigo).toBe("status");
    expect(listarPorStatus(db, ["entregue"]).map((p) => p.id)).toEqual([v.id]);
    expect(estoque(babyM)).toBe(antes);
  });

  it("cancelar pedido expirado não devolve de novo", () => {
    const p = pedido(babyP);
    expirarVencidos(db, min(60));
    expect(estoque(babyP)).toBe(1);
    cancelar(db, p.id);
    expect(estoque(babyP)).toBe(1);
  });

  it("cancelar pago_sem_peca não mexe no estoque", () => {
    const p = pedido(babyP);
    expirarVencidos(db, min(60));
    pedido(babyP, 1, "pix", min(61));
    marcarPago(db, p.codigo, null, min(70));
    cancelar(db, p.id);
    expect(estoque(babyP)).toBe(0);
  });
});

describe("consultas", () => {
  it("listarPorStatus traz itens; abertosComCobranca só aguardando com asaasId", () => {
    const a = pedido(babyM);
    const b = pedido(babyM);
    pedido(babyM);
    salvarCobranca(db, a.id, { asaasId: "pay_a", invoiceUrl: "https://a" });
    salvarCobranca(db, b.id, { asaasId: "pay_b", parcelamentoId: "ins_b", invoiceUrl: "https://b" });
    marcarPago(db, b.codigo, null, min(1));

    expect(abertosComCobranca(db).map((p) => p.codigo)).toEqual([a.codigo]);
    const pagos = listarPorStatus(db, ["pago"]);
    expect(pagos.map((p) => [p.codigo, p.asaasParcelamentoId, p.itens.length])).toEqual([[b.codigo, "ins_b", 1]]);
    expect(listarPorStatus(db, ["aguardando", "pago"])).toHaveLength(3);
    expect(listarPorStatus(db, [])).toEqual([]);
    expect(buscarPorCodigo(db, "nada")).toBeNull();
  });
});
