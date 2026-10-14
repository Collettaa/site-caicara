import type { PedidoComItens } from "./pedidos";
import type { StatusPedido } from "./tipos";

/** Status que contam como venda no CSV (dinheiro entrou). */
export const STATUS_VENDA: StatusPedido[] = ["pago", "entregue", "pago_sem_peca"];

const CABECALHO = ["data_pagamento", "codigo", "cliente", "itens", "forma", "bruto", "liquido", "origem"];

const partesSP = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** ISO UTC → "AAAA-MM-DD HH:mm" no horário de São Paulo. */
export function dataHoraSP(iso: string): string {
  const p = Object.fromEntries(partesSP.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/** Centavos → "65,00". */
function valor(centavos: number | null): string {
  if (centavos === null) return "";
  const sinal = centavos < 0 ? "-" : "";
  const abs = Math.abs(centavos);
  return `${sinal}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")}`;
}

/** Aspas quando precisa; texto que o Excel leria como fórmula ganha um apóstrofo na frente. */
function campo(texto: string): string {
  let t = texto;
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  if (/[;"\r\n]/.test(t)) t = `"${t.replace(/"/g, '""')}"`;
  return t;
}

/**
 * CSV das vendas (pago, entregue, pago sem peça), uma linha por pedido, do pagamento mais antigo
 * ao mais novo. Separador `;`, vírgula decimal e BOM UTF-8 para o Excel abrir com acento certo.
 */
export function vendasCsv(pedidos: PedidoComItens[]): string {
  const vendas = pedidos
    .filter((p) => STATUS_VENDA.includes(p.status))
    .sort((a, b) => (a.pagoEm ?? a.criadoEm).localeCompare(b.pagoEm ?? b.criadoEm) || a.id - b.id);

  const linhas = vendas.map((p) =>
    [
      p.pagoEm ? dataHoraSP(p.pagoEm) : "",
      campo(p.codigo),
      campo(p.nome),
      campo(p.itens.map((i) => `${i.qtd}x ${i.descricao}`).join(", ")),
      p.forma,
      valor(p.total),
      valor(p.liquido),
      p.origem,
    ].join(";"),
  );

  return `﻿${[CABECALHO.join(";"), ...linhas].join("\r\n")}\r\n`;
}
