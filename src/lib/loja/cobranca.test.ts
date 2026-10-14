import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cancelarCobranca, consultarPagamento, criarCobranca, lojaAsaasCfg } from "@/lib/loja/cobranca";
import type { PedidoComItens } from "@/lib/loja/pedidos";

const LOJA_URL = "https://loja.asaas.test/v3";
const CPF = "52998224725";

type Chamada = { url: string; init: RequestInit };
let chamadas: Chamada[];
let respostas: ((url: string, init: RequestInit) => Response | undefined)[];

function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}

function pedido(parcial: Partial<PedidoComItens> = {}): PedidoComItens {
  return {
    id: 1,
    codigo: "abcDEF123_-xyz00",
    nome: "Maria Teste",
    whatsapp: "5513920013547",
    aceitaMsgs: true,
    forma: "pix",
    origem: "site",
    status: "aguardando",
    total: 6500,
    liquido: null,
    asaasId: null,
    asaasParcelamentoId: null,
    pixQr: null,
    pixCopiaCola: null,
    invoiceUrl: null,
    reservadoAte: "2026-10-14T16:00:00.000Z",
    criadoEm: "2026-10-14T15:00:00.000Z",
    pagoEm: null,
    entregueEm: null,
    itens: [{ id: 1, pedidoId: 1, variacaoId: 1, qtd: 1, precoUnit: 6500, descricao: "Camiseta Caiçara · Baby look M" }],
    ...parcial,
  };
}

const corpoDe = (c: Chamada) => JSON.parse(String(c.init.body));
const cliente = { nome: "Maria Teste", cpf: "529.982.247-25", whatsapp: "5513920013547" };

beforeEach(() => {
  chamadas = [];
  respostas = [];
  vi.stubEnv("LOJA_ASAAS_URL", LOJA_URL);
  vi.stubEnv("LOJA_ASAAS_API_KEY", "chave-loja");
  vi.stubEnv("ASAAS_URL", "https://aulao.asaas.test/v3");
  vi.stubEnv("ASAAS_API_KEY", "chave-aulao");
  vi.stubEnv("SITE_URL", "https://caicara.store");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      chamadas.push({ url: String(url), init });
      for (const r of respostas) {
        const resp = r(String(url), init);
        if (resp) return resp;
      }
      return json({ erro: "sem mock" }, 500);
    }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("lojaAsaasCfg", () => {
  it("usa LOJA_ASAAS_* e devolve null sem chave", () => {
    expect(lojaAsaasCfg()).toEqual({ url: LOJA_URL, apiKey: "chave-loja" });
    vi.stubEnv("LOJA_ASAAS_URL", "");
    expect(lojaAsaasCfg()?.url).toBe("https://api.asaas.com/v3");
    vi.stubEnv("LOJA_ASAAS_API_KEY", "");
    expect(lojaAsaasCfg()).toBeNull();
  });
});

describe("criarCobranca", () => {
  it("cartao2 manda installmentCount 2 e totalValue, só na URL e chave da loja", async () => {
    respostas.push((url) => (url.endsWith("/customers") ? json({ id: "cus_1" }) : undefined));
    respostas.push((url) =>
      url.endsWith("/payments")
        ? json({ id: "pay_1", installment: "ins_1", invoiceUrl: "https://asaas.test/i/1" })
        : undefined,
    );

    const r = await criarCobranca(pedido({ forma: "cartao2", total: 7000 }), cliente);

    expect(r).toEqual({ asaasId: "pay_1", parcelamentoId: "ins_1", invoiceUrl: "https://asaas.test/i/1" });
    expect(chamadas).toHaveLength(2);
    for (const c of chamadas) {
      expect(c.url.startsWith(LOJA_URL)).toBe(true);
      expect((c.init.headers as Record<string, string>).access_token).toBe("chave-loja");
    }

    const cus = corpoDe(chamadas[0]);
    expect(cus).toMatchObject({ name: "Maria Teste", cpfCnpj: CPF, mobilePhone: "13920013547", notificationDisabled: true });

    const pay = corpoDe(chamadas[1]);
    expect(pay).toMatchObject({
      customer: "cus_1",
      billingType: "CREDIT_CARD",
      installmentCount: 2,
      totalValue: 70,
      externalReference: "loja:abcDEF123_-xyz00",
      callback: { successUrl: "https://caicara.store/loja/pedido/abcDEF123_-xyz00", autoRedirect: true },
    });
    expect(pay.value).toBeUndefined();
    expect(pay.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(pay.description).toContain("1x Camiseta Caiçara · Baby look M");
  });

  it("cartao1 manda value sem parcelas", async () => {
    respostas.push((url) => (url.endsWith("/customers") ? json({ id: "cus_1" }) : undefined));
    respostas.push((url) => (url.endsWith("/payments") ? json({ id: "pay_2", invoiceUrl: "https://asaas.test/i/2" }) : undefined));

    const r = await criarCobranca(pedido({ forma: "cartao1", total: 7000 }), cliente);

    expect(r).toEqual({ asaasId: "pay_2", invoiceUrl: "https://asaas.test/i/2" });
    const pay = corpoDe(chamadas[1]);
    expect(pay).toMatchObject({ billingType: "CREDIT_CARD", value: 70 });
    expect(pay.installmentCount).toBeUndefined();
    expect(pay.totalValue).toBeUndefined();
  });

  it("pix busca /pixQrCode e devolve copia e cola", async () => {
    respostas.push((url) => (url.endsWith("/customers") ? json({ id: "cus_1" }) : undefined));
    respostas.push((url) => (url.endsWith("/payments") ? json({ id: "pay_3", invoiceUrl: "https://asaas.test/i/3" }) : undefined));
    respostas.push((url) =>
      url.endsWith("/payments/pay_3/pixQrCode") ? json({ encodedImage: "BASE64PNG", payload: "000201PIX" }) : undefined,
    );

    const r = await criarCobranca(pedido({ forma: "pix", total: 13000 }), cliente);

    expect(r).toEqual({
      asaasId: "pay_3",
      pixQr: "BASE64PNG",
      pixCopiaCola: "000201PIX",
      invoiceUrl: "https://asaas.test/i/3",
    });
    expect(corpoDe(chamadas[1])).toMatchObject({ billingType: "PIX", value: 130 });
    expect(chamadas[2].url).toBe(`${LOJA_URL}/payments/pay_3/pixQrCode`);
  });

  it("pix: QR falhou depois do pagamento criado → devolve só a fatura, sem lançar", async () => {
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
    respostas.push((url) => (url.endsWith("/customers") ? json({ id: "cus_1" }) : undefined));
    respostas.push((url) => (url.endsWith("/payments") ? json({ id: "pay_3", invoiceUrl: "https://asaas.test/i/3" }) : undefined));
    respostas.push((url) => (url.endsWith("/pixQrCode") ? json({ erro: "fora" }, 503) : undefined));

    const r = await criarCobranca(pedido({ forma: "pix" }), cliente);

    expect(r).toEqual({ asaasId: "pay_3", invoiceUrl: "https://asaas.test/i/3" });
    expect(aviso).toHaveBeenCalled();
  });

  it("sem LOJA_ASAAS_API_KEY não cai na chave do Aulão", async () => {
    vi.stubEnv("LOJA_ASAAS_API_KEY", "");
    await expect(criarCobranca(pedido(), cliente)).rejects.toThrow();
    expect(chamadas).toHaveLength(0);
  });

  it("CPF não aparece em log nem na mensagem de erro", async () => {
    const espioes = (["log", "info", "warn", "error", "debug"] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );
    respostas.push((url) =>
      url.endsWith("/customers")
        ? json({ errors: [{ code: "invalid_cpfCnpj", description: `O CPF ${CPF} (529.982.247-25) é inválido` }] }, 400)
        : undefined,
    );

    let erro: unknown;
    try {
      await criarCobranca(pedido(), cliente);
    } catch (e) {
      erro = e;
      console.error("loja: falha ao gerar cobrança", e);
    }

    expect(erro).toBeInstanceOf(Error);
    const msg = String((erro as Error).message) + String((erro as Error).stack);
    expect(msg).not.toContain(CPF);
    expect(msg).not.toContain("529.982.247-25");
    for (const espiao of espioes) {
      const tudo = JSON.stringify(espiao.mock.calls.map((args) => args.map((a) => (a instanceof Error ? `${a.message} ${a.stack}` : a))));
      expect(tudo).not.toContain(CPF);
      expect(tudo).not.toContain("529.982.247-25");
    }
  });
});

describe("criarCobranca — casos de erro do Asaas", () => {
  it("sem domínio cadastrado tenta de novo uma vez sem callback e avisa", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    respostas.push((url) => (url.endsWith("/customers") ? json({ id: "cus_1" }) : undefined));
    respostas.push((url, init) => {
      if (!url.endsWith("/payments")) return undefined;
      const corpo = JSON.parse(String(init.body));
      if (corpo.callback)
        return json(
          {
            errors: [
              {
                code: "invalid_object",
                description: "Não há nenhum domínio configurado em sua conta. Cadastre um site em Minha Conta na aba Informações.",
              },
            ],
          },
          400,
        );
      return json({ id: "pay_9", invoiceUrl: "https://asaas.test/i/9" });
    });

    const r = await criarCobranca(pedido({ forma: "cartao1", total: 7000 }), cliente);

    expect(r).toEqual({ asaasId: "pay_9", invoiceUrl: "https://asaas.test/i/9" });
    const pagamentos = chamadas.filter((c) => c.url.endsWith("/payments"));
    expect(pagamentos).toHaveLength(2);
    expect(corpoDe(pagamentos[0]).callback).toBeDefined();
    expect(corpoDe(pagamentos[1]).callback).toBeUndefined();
    expect(corpoDe(pagamentos[1])).toMatchObject({ billingType: "CREDIT_CARD", value: 70, externalReference: "loja:abcDEF123_-xyz00" });
    expect(warn).toHaveBeenCalledWith("loja: Asaas sem domínio cadastrado; cobrança sem retorno automático");
  });

  it("outro 400 no /payments lança sem tentar de novo", async () => {
    respostas.push((url) => (url.endsWith("/customers") ? json({ id: "cus_1" }) : undefined));
    respostas.push((url) =>
      url.endsWith("/payments") ? json({ errors: [{ code: "invalid_value", description: "Valor inválido" }] }, 400) : undefined,
    );

    await expect(criarCobranca(pedido(), cliente)).rejects.toThrow(/400/);
    expect(chamadas.filter((c) => c.url.endsWith("/payments"))).toHaveLength(1);
  });

  it("CPF vindo só em dígitos sai mascarado mesmo se o Asaas devolver com pontos e traço", async () => {
    respostas.push((url) =>
      url.endsWith("/customers")
        ? json({ errors: [{ code: "invalid_cpfCnpj", description: "O CPF 529.982.247-25 é inválido" }] }, 400)
        : undefined,
    );

    const erro = await criarCobranca(pedido(), { ...cliente, cpf: CPF }).catch((e: Error) => e);

    expect(erro).toBeInstanceOf(Error);
    const msg = `${(erro as Error).message} ${(erro as Error).stack}`;
    expect(msg).not.toContain("529.982.247-25");
    expect(msg).not.toContain(CPF);
    expect(msg).toContain("***");
  });
});

describe("consultarPagamento", () => {
  it("parcelado soma netValue das parcelas", async () => {
    respostas.push((url) =>
      url === `${LOJA_URL}/payments?installment=ins_1`
        ? json({ data: [{ status: "CONFIRMED", netValue: 33.51 }, { status: "CONFIRMED", netValue: 33.51 }] })
        : undefined,
    );

    const r = await consultarPagamento(pedido({ forma: "cartao2", total: 7000, asaasId: "pay_1", asaasParcelamentoId: "ins_1" }));

    expect(r).toEqual({ pago: true, liquido: 6702 });
  });

  it("à vista: pago pelo status, líquido em centavos", async () => {
    respostas.push((url) => (url === `${LOJA_URL}/payments/pay_3` ? json({ status: "RECEIVED", netValue: 64.01 }) : undefined));
    expect(await consultarPagamento(pedido({ asaasId: "pay_3" }))).toEqual({ pago: true, liquido: 6401 });
  });

  it("pendente não é pago", async () => {
    respostas.push((url) => (url === `${LOJA_URL}/payments/pay_3` ? json({ status: "PENDING", netValue: 64.01 }) : undefined));
    expect(await consultarPagamento(pedido({ asaasId: "pay_3" }))).toEqual({ pago: false, liquido: null });
  });
});

describe("cancelarCobranca", () => {
  it("parcelado apaga o parcelamento", async () => {
    respostas.push((url, init) =>
      url === `${LOJA_URL}/installments/ins_1` && init.method === "DELETE" ? json({ deleted: true, id: "ins_1" }) : undefined,
    );
    await cancelarCobranca(pedido({ asaasId: "pay_1", asaasParcelamentoId: "ins_1" }));
    expect(chamadas).toHaveLength(1);
  });

  const del = (caminho: string, resp: Response) => (url: string, init: RequestInit) =>
    url === `${LOJA_URL}${caminho}` && init.method === "DELETE" ? resp : undefined;
  const get = (caminho: string, resp: Response) => (url: string, init: RequestInit) =>
    url === `${LOJA_URL}${caminho}` && (init.method ?? "GET") === "GET" ? resp : undefined;

  it("404 no DELETE e 404 na consulta: já não existe, não lança", async () => {
    respostas.push(del("/payments/pay_3", json({ errors: [] }, 404)), get("/payments/pay_3", json({ errors: [] }, 404)));
    await expect(cancelarCobranca(pedido({ asaasId: "pay_3" }))).resolves.toBeUndefined();
  });

  it("já cancelada pelo verificador: DELETE dá 400, consulta diz deleted → não lança", async () => {
    respostas.push(
      del("/payments/pay_4", json({ errors: [{ code: "invalid_action", description: "já removida" }] }, 400)),
      get("/payments/pay_4", json({ id: "pay_4", deleted: true, status: "PENDING" })),
    );
    await expect(cancelarCobranca(pedido({ asaasId: "pay_4" }))).resolves.toBeUndefined();
    expect(chamadas.map((c) => c.init.method ?? "GET")).toEqual(["DELETE", "GET"]);
  });

  it("DELETE 404 e consulta diz deleted → não lança", async () => {
    respostas.push(
      del("/payments/pay_5", json({ errors: [] }, 404)),
      get("/payments/pay_5", json({ id: "pay_5", deleted: true })),
    );
    await expect(cancelarCobranca(pedido({ asaasId: "pay_5" }))).resolves.toBeUndefined();
  });

  it("parcelamento já cancelado: consulta o parcelamento", async () => {
    respostas.push(
      del("/installments/ins_2", json({ errors: [] }, 400)),
      get("/installments/ins_2", json({ id: "ins_2", deleted: true })),
    );
    await expect(
      cancelarCobranca(pedido({ asaasId: "pay_1", asaasParcelamentoId: "ins_2" })),
    ).resolves.toBeUndefined();
    expect(chamadas.map((c) => c.url)).toEqual([`${LOJA_URL}/installments/ins_2`, `${LOJA_URL}/installments/ins_2`]);
  });

  it("400 e a cobrança segue viva (ex.: paga) → lança o erro do DELETE", async () => {
    respostas.push(
      del("/payments/pay_6", json({ errors: [] }, 400)),
      get("/payments/pay_6", json({ id: "pay_6", deleted: false, status: "RECEIVED" })),
    );
    await expect(cancelarCobranca(pedido({ asaasId: "pay_6" }))).rejects.toThrow(/400/);
  });

  it("400 e a consulta também falha → lança o erro do DELETE", async () => {
    respostas.push(del("/payments/pay_7", json({ errors: [] }, 400)), get("/payments/pay_7", json({}, 500)));
    await expect(cancelarCobranca(pedido({ asaasId: "pay_7" }))).rejects.toThrow(/400/);
  });

  it("outro erro lança sem consultar", async () => {
    respostas.push(() => json({ errors: [] }, 500));
    await expect(cancelarCobranca(pedido({ asaasId: "pay_3" }))).rejects.toThrow(/500/);
    expect(chamadas).toHaveLength(1);
  });
});
