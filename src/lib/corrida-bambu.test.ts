import { describe, expect, it } from "vitest";
import { contarCamisetas, descreverItens, disponiveis, juntarInscricoes, juntarPedidos, limparItens, type PedidoCamiseta } from "@/lib/corrida-bambu";

const linha = (o: object) => JSON.stringify(o);
const pedido = (o: Partial<PedidoCamiseta>): PedidoCamiseta => ({
  id: "p",
  nome: "a",
  whatsapp: "1",
  itens: {},
  total: 0,
  forma: "pix",
  criadoEm: "2026-11-19T12:00:00Z",
  ...o,
});

describe("juntarInscricoes", () => {
  it("mesmo WhatsApp vale a última e ignora ajuste antigo", () => {
    const raw = [linha({ nome: "Ana", whatsapp: "5513", criadoEm: "x" }), linha({ ajuste: "5513", pixPago: true }), linha({ nome: "Ana Paula", whatsapp: "5513", criadoEm: "y" })].join("\n");
    expect(juntarInscricoes(raw)).toEqual([{ nome: "Ana Paula", whatsapp: "5513", criadoEm: "y" }]);
  });
});

describe("juntarPedidos", () => {
  it("cada pedido vale por si e o ajuste marca pago", () => {
    const raw = [
      linha(pedido({ id: "pay_1", itens: { M: 2 } })),
      linha(pedido({ id: "pay_2", itens: { G: 1 } })),
      linha({ ajuste: "pay_1", pago: true }),
    ].join("\n");
    const r = juntarPedidos(raw);
    expect(r).toHaveLength(2);
    expect(r.find((p) => p.id === "pay_1")?.pago).toBe(true);
    expect(r.find((p) => p.id === "pay_2")?.pago).toBeUndefined();
  });
});

describe("itens", () => {
  it("limpa tamanho inválido e quantidade não inteira", () => {
    expect(limparItens({ P: 2, M: 0, G: 1.5, GG: "3", XL: 4 })).toEqual({ P: 2, GG: 3 });
  });
  it("descreve na ordem dos tamanhos", () => {
    expect(descreverItens({ G: 1, M: 2 })).toBe("2 M, 1 G");
  });
});

describe("estoque", () => {
  const agora = Date.parse("2026-11-20T12:00:00Z");
  it("desconta pagos e pendentes de até 2h; pendente velho libera", () => {
    const r = disponiveis(
      [
        pedido({ id: "a", itens: { GG: 2, M: 1 }, pago: true, criadoEm: "2026-11-19T12:00:00Z" }),
        pedido({ id: "b", itens: { GG: 1 }, criadoEm: "2026-11-20T11:30:00Z" }),
        pedido({ id: "c", itens: { GG: 3 }, criadoEm: "2026-11-20T08:00:00Z" }),
      ],
      agora,
    );
    expect(r).toEqual({ P: 20, M: 29, G: 20, GG: 7 });
  });
  it("conta pagas por tamanho e peças aguardando", () => {
    const r = contarCamisetas([pedido({ id: "a", itens: { M: 2 }, pago: true }), pedido({ id: "b", itens: { P: 1, GG: 2 } })]);
    expect(r).toEqual({ pagas: { P: 0, M: 2, G: 0, GG: 0 }, aguardando: 3 });
  });
});

describe("entregue do /bambu", () => {
  it("linha de entregue marca a retirada só uma vez", () => {
    const raw = [
      linha(pedido({ id: "pay_1", itens: { M: 1 } })),
      linha({ ajuste: "pay_1", pago: true }),
      linha({ entregue: "pay_1", em: "2026-11-27T23:00:00.000Z" }),
      linha({ entregue: "pay_1", em: "2026-11-28T10:00:00.000Z" }),
    ].join("\n");
    const [p] = juntarPedidos(raw);
    expect(p.pago).toBe(true);
    expect(p.entregueEm).toBe("2026-11-27T23:00:00.000Z");
  });
});
