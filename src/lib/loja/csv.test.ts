import { describe, expect, it } from "vitest";
import { vendasCsv } from "./csv";
import type { PedidoComItens } from "./pedidos";

function pedido(extra: Partial<PedidoComItens> = {}): PedidoComItens {
  return {
    id: 1,
    codigo: "abcdefghijklmnop",
    nome: "Ana Souza",
    whatsapp: "5513999999999",
    aceitaMsgs: false,
    forma: "pix",
    origem: "site",
    status: "pago",
    total: 6500,
    liquido: 6401,
    asaasId: "pay_1",
    asaasParcelamentoId: null,
    pixQr: null,
    pixCopiaCola: null,
    invoiceUrl: null,
    reservadoAte: null,
    criadoEm: "2026-10-14T13:00:00.000Z",
    pagoEm: "2026-10-14T13:05:00.000Z",
    entregueEm: null,
    itens: [
      { id: 1, pedidoId: 1, variacaoId: 2, qtd: 1, precoUnit: 6500, descricao: "Camiseta Caiçara · Baby look M" },
    ],
    ...extra,
  };
}

const linhas = (csv: string) => csv.replace(/^﻿/, "").trimEnd().split("\r\n");

describe("vendasCsv", () => {
  it("começa com BOM e o cabeçalho certo", () => {
    const csv = vendasCsv([]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(linhas(csv)[0]).toBe("data_pagamento;codigo;cliente;itens;forma;bruto;liquido;origem");
  });

  it("pedido Pix 6500 com líquido 6401 sai com vírgula decimal", () => {
    const [, linha] = linhas(vendasCsv([pedido()]));
    expect(linha.endsWith("65,00;64,01;site")).toBe(true);
    expect(linha).toBe(
      "2026-10-14 10:05;abcdefghijklmnop;Ana Souza;1x Camiseta Caiçara · Baby look M;pix;65,00;64,01;site",
    );
  });

  it("só entra pago, entregue e pago_sem_peca", () => {
    const csv = vendasCsv([
      pedido({ id: 1, codigo: "pago000000000000" }),
      pedido({ id: 2, codigo: "cancelado0000000", status: "cancelado" }),
      pedido({ id: 3, codigo: "aguardando000000", status: "aguardando", pagoEm: null }),
      pedido({ id: 4, codigo: "entregue00000000", status: "entregue" }),
      pedido({ id: 5, codigo: "sempeca000000000", status: "pago_sem_peca" }),
    ]);
    expect(csv).not.toContain("cancelado0000000");
    expect(csv).not.toContain("aguardando000000");
    expect(linhas(csv)).toHaveLength(4);
  });

  it("nome com ; ou aspas vem entre aspas", () => {
    const [, linha] = linhas(vendasCsv([pedido({ nome: 'Ana; "Aninha"' })]));
    expect(linha).toContain(';"Ana; ""Aninha""";');
  });

  it("nome que parece fórmula não vira fórmula no Excel", () => {
    const [, linha] = linhas(vendasCsv([pedido({ nome: "=1+1" })]));
    expect(linha).toContain(";'=1+1;");
  });

  it("líquido desconhecido sai vazio", () => {
    const [, linha] = linhas(vendasCsv([pedido({ liquido: null })]));
    expect(linha.endsWith(";65,00;;site")).toBe(true);
  });
});
