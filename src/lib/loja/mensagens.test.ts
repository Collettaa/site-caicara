import { describe, expect, it } from "vitest";
import { dentroDaJanela, mensagensDevidas, textoMensagem, type Enviada } from "@/lib/loja/mensagens";
import type { PedidoComItens } from "@/lib/loja/pedidos";

// 15:00 UTC = 12:00 em São Paulo
const T0 = new Date("2026-10-14T15:00:00.000Z");
const horas = (n: number) => new Date(T0.getTime() + n * 3_600_000);
const LINK = "https://caicara.store/loja/pedido/abcDEF123_-xyz00";

function pedido(parcial: Partial<PedidoComItens> = {}): PedidoComItens {
  return {
    id: 1,
    codigo: "abcDEF123_-xyz00",
    nome: "Maria",
    whatsapp: "5513920013547",
    aceitaMsgs: false,
    forma: "pix",
    origem: "site",
    status: "expirado",
    total: 6500,
    liquido: null,
    asaasId: "pay_1",
    asaasParcelamentoId: null,
    pixQr: null,
    pixCopiaCola: null,
    invoiceUrl: null,
    reservadoAte: horas(1).toISOString(),
    criadoEm: T0.toISOString(),
    pagoEm: null,
    entregueEm: null,
    itens: [{ id: 1, pedidoId: 1, variacaoId: 1, qtd: 1, precoUnit: 6500, descricao: "Camiseta Caiçara · Baby look M" }],
    ...parcial,
  };
}

const enviada = (tipo: Enviada["tipo"]): Enviada => ({ tipo, tentativas: 1, enviadaEm: T0.toISOString() });
const ok = { temEstoque: true, pagouOutroDepois: false };

describe("dentroDaJanela", () => {
  it("8h às 21h em São Paulo (UTC−3), com o servidor em UTC", () => {
    expect(dentroDaJanela(new Date("2026-10-14T10:59:00.000Z"))).toBe(false); // 07:59
    expect(dentroDaJanela(new Date("2026-10-14T11:00:00.000Z"))).toBe(true); // 08:00
    expect(dentroDaJanela(new Date("2026-10-14T23:59:00.000Z"))).toBe(true); // 20:59
    expect(dentroDaJanela(new Date("2026-10-15T00:00:00.000Z"))).toBe(false); // 21:00
  });
});

describe("mensagensDevidas", () => {
  it("sem aceitaMsgs, expirado há 2h: só o recebido, e só se ainda não foi", () => {
    expect(mensagensDevidas(pedido(), [], horas(2), ok)).toEqual(["recebido"]);
    expect(mensagensDevidas(pedido(), [enviada("recebido")], horas(2), ok)).toEqual([]);
  });

  it("com aceitaMsgs: lembrete de 1h; sem estoque ou com outro pedido pago depois, nada", () => {
    const p = pedido({ aceitaMsgs: true });
    const ja = [enviada("recebido")];
    expect(mensagensDevidas(p, ja, horas(2), ok)).toEqual(["lembrete1h"]);
    expect(mensagensDevidas(p, ja, horas(2), { temEstoque: false, pagouOutroDepois: false })).toEqual([]);
    expect(mensagensDevidas(p, ja, horas(2), { temEstoque: true, pagouOutroDepois: true })).toEqual([]);
  });

  it("lembrete de 1h não sai antes de 1h", () => {
    const p = pedido({ aceitaMsgs: true, status: "aguardando" });
    expect(mensagensDevidas(p, [enviada("recebido")], new Date(T0.getTime() + 59 * 60_000), ok)).toEqual([]);
  });

  it("25h depois com lembrete1h enviado: lembrete24h; às 22h, nada", () => {
    const p = pedido({ aceitaMsgs: true });
    const ja = [enviada("recebido"), enviada("lembrete1h")];
    expect(mensagensDevidas(p, ja, horas(25), ok)).toEqual(["lembrete24h"]); // 13h em SP
    expect(mensagensDevidas(p, ja, new Date("2026-10-16T01:00:00.000Z"), ok)).toEqual([]); // 22h em SP
    expect(mensagensDevidas(p, [enviada("recebido")], horas(25), ok)).toEqual(["lembrete1h"]);
  });

  it("pago: mensagem ao cliente e aviso ao dono, sem repetir", () => {
    const p = pedido({ status: "pago", pagoEm: horas(0.5).toISOString() });
    const ja = [enviada("recebido")];
    expect(mensagensDevidas(p, ja, horas(1), ok)).toEqual(["pago", "aviso_venda"]);
    expect(mensagensDevidas(p, [...ja, enviada("pago"), enviada("aviso_venda")], horas(1), ok)).toEqual([]);
  });

  it("fora da janela só o aviso ao dono sai", () => {
    const p = pedido({ status: "pago" });
    expect(mensagensDevidas(p, [], new Date("2026-10-15T02:00:00.000Z"), ok)).toEqual(["aviso_venda"]);
    const semPeca = pedido({ status: "pago_sem_peca" });
    expect(mensagensDevidas(semPeca, [], new Date("2026-10-15T02:00:00.000Z"), ok)).toEqual(["aviso_sem_peca"]);
  });

  it("ignora tipo que já falhou 3 vezes; tenta de novo com menos", () => {
    const p = pedido({ status: "pago" });
    const falhou = (tentativas: number): Enviada[] => [
      enviada("recebido"),
      enviada("aviso_venda"),
      { tipo: "pago", tentativas, enviadaEm: null },
    ];
    expect(mensagensDevidas(p, falhou(2), horas(2), ok)).toEqual(["pago"]);
    expect(mensagensDevidas(p, falhou(3), horas(2), ok)).toEqual([]);
  });

  it("pedido do balcão não recebe nada", () => {
    expect(mensagensDevidas(pedido({ origem: "balcao", status: "entregue" }), [], horas(1), ok)).toEqual([]);
  });
});

describe("textoMensagem", () => {
  it("pago: texto 4 do spec, letra por letra", () => {
    expect(textoMensagem("pago", pedido({ status: "pago" }), LINK)).toBe(
      "Pagamento confirmado ✅ Valeu, Maria!\n" +
        "Retire no box em qualquer horário de aula, seg a sex, 6h às 21h.\n" +
        "Av. Embaixador Pedro de Toledo, 593 · São Vicente\n" +
        "Troca de tamanho em até 7 dias, conforme estoque.",
    );
  });

  it("recebido, lembretes e avisos", () => {
    const p = pedido({
      total: 13050,
      itens: [
        { id: 1, pedidoId: 1, variacaoId: 1, qtd: 1, precoUnit: 6500, descricao: "Camiseta Caiçara · Baby look M" },
        { id: 2, pedidoId: 1, variacaoId: 2, qtd: 2, precoUnit: 3275, descricao: "Camiseta Caiçara · Tradicional G" },
      ],
    });
    expect(textoMensagem("recebido", p, LINK)).toBe(
      "Oi, Maria! Recebi seu pedido na loja da Caiçara 🌴\n" +
        "1x Baby look M, 2x Tradicional G\n" +
        "Total: R$ 130,50 no Pix\n" +
        `Separei sua peça por 1h. Pra pagar: ${LINK}`,
    );
    expect(textoMensagem("lembrete1h", p, LINK)).toBe(
      `Maria, seu pedido da Caiçara ainda tá em aberto. A reserva venceu, mas a peça ainda tá disponível. Se quiser garantir: ${LINK}`,
    );
    expect(textoMensagem("lembrete24h", pedido(), LINK)).toBe(
      `Oi, Maria! Passando só pra lembrar da 1x Baby look M da Caiçara. Ainda dá pra garantir aqui: ${LINK}\n` +
        "Se não for agora, tranquilo 🤙",
    );
    expect(textoMensagem("aviso_venda", pedido({ forma: "cartao2", total: 7000 }), LINK)).toBe(
      "💰 Venda paga: 1x Baby look M · cartão 2x R$ 70 · Maria · wa.me/5513920013547",
    );
    expect(textoMensagem("aviso_sem_peca", pedido(), LINK)).toBe(
      "⚠️ Pago sem peça: 1x Baby look M · Maria · wa.me/5513920013547 — troca o tamanho ou estorna no Asaas.",
    );
  });

  it("forma no recebido: cartão 1x e 2x", () => {
    expect(textoMensagem("recebido", pedido({ forma: "cartao1", total: 7000 }), LINK)).toContain(
      "Total: R$ 70 no cartão\n",
    );
    expect(textoMensagem("recebido", pedido({ forma: "cartao2", total: 7000 }), LINK)).toContain(
      "Total: R$ 70 no cartão 2x\n",
    );
  });
});
