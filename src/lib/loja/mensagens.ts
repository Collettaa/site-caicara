// Mensagens da loja no WhatsApp: textos (copiados do spec, sem mudar) e a regra de quando cada uma sai.

import type { Forma, ItemPedido, Pedido, TipoMensagem } from "./tipos";

const HORA_MS = 60 * 60 * 1000;
export const MAX_TENTATIVAS = 3;

/** O que já foi registrado na tabela `mensagens` para o pedido. */
export interface Enviada {
  tipo: TipoMensagem;
  tentativas: number;
  enviadaEm: string | null;
}

export interface ContextoMensagens {
  /** Todos os itens do pedido têm estoque suficiente agora. */
  temEstoque: boolean;
  /** O mesmo WhatsApp pagou outro pedido criado depois deste. */
  pagouOutroDepois: boolean;
}

const AVISOS_AO_DONO: TipoMensagem[] = ["aviso_venda", "aviso_sem_peca"];

export function ehAvisoAoDono(tipo: TipoMensagem): boolean {
  return AVISOS_AO_DONO.includes(tipo);
}

/** "R$ 65" quando inteiro; "R$ 65,50" quando tem centavos. Recebe centavos. */
export function reais(centavos: number): string {
  const inteiro = centavos % 100 === 0;
  return `R$ ${(centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: inteiro ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

const NOME_FORMA: Record<Forma, string> = {
  pix: "Pix",
  cartao1: "cartão",
  cartao2: "cartão 2x",
  balcao_dinheiro: "dinheiro",
  balcao_pix: "Pix",
  balcao_cartao: "cartão",
};

/** "1x Baby look M, 2x Tradicional G" — a descrição gravada é "Produto · Modelo Tamanho". */
export function textoItens(itens: ItemPedido[]): string {
  return itens
    .map((i) => {
      const partes = i.descricao.split(" · ");
      const variacao = partes.length > 1 ? partes.slice(1).join(" · ") : i.descricao;
      return `${i.qtd}x ${variacao}`;
    })
    .join(", ");
}

export function textoMensagem(tipo: TipoMensagem, pedido: Pedido & { itens: ItemPedido[] }, link: string): string {
  const nome = pedido.nome;
  const itens = textoItens(pedido.itens);
  const total = reais(pedido.total);
  const forma = NOME_FORMA[pedido.forma];
  switch (tipo) {
    case "recebido":
      return (
        `Oi, ${nome}! Recebi seu pedido na loja da Caiçara 🌴\n` +
        `${itens}\n` +
        `Total: ${total} no ${forma}\n` +
        `Separei sua peça por 1h. Pra pagar: ${link}`
      );
    case "lembrete1h":
      return `${nome}, seu pedido da Caiçara ainda tá em aberto. A reserva venceu, mas a peça ainda tá disponível. Se quiser garantir: ${link}`;
    case "lembrete24h":
      return (
        `Oi, ${nome}! Passando só pra lembrar da ${itens} da Caiçara. Ainda dá pra garantir aqui: ${link}\n` +
        "Se não for agora, tranquilo 🤙"
      );
    case "pago":
      return (
        `Pagamento confirmado ✅ Valeu, ${nome}!\n` +
        "Retire no box em qualquer horário de aula, seg a sex, 6h às 21h.\n" +
        "Av. Embaixador Pedro de Toledo, 593 · São Vicente\n" +
        "Troca de tamanho em até 7 dias, conforme estoque."
      );
    case "aviso_venda":
      return `💰 Venda paga: ${itens} · ${forma} ${total} · ${nome} · wa.me/${pedido.whatsapp}`;
    case "aviso_sem_peca":
      return `⚠️ Pago sem peça: ${itens} · ${nome} · wa.me/${pedido.whatsapp} — troca o tamanho ou estorna no Asaas.`;
  }
}

const formatoHora = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Sao_Paulo",
  hour: "numeric",
  hourCycle: "h23",
});

/** Entre 8h e 21h em São Paulo (o container roda em UTC). */
export function dentroDaJanela(agora: Date): boolean {
  const hora = Number(formatoHora.formatToParts(agora).find((p) => p.type === "hour")?.value);
  return hora >= 8 && hora < 21;
}

/**
 * Regra pura: quais mensagens o pedido deve receber agora, na ordem de envio.
 * Nunca repete tipo já enviado; desiste de tipo com 3 tentativas; fora da janela só os avisos ao dono.
 */
export function mensagensDevidas(
  pedido: Pedido,
  enviadas: Enviada[],
  agora: Date,
  contexto: ContextoMensagens,
): TipoMensagem[] {
  if (pedido.origem !== "site") return [];

  const registro = new Map(enviadas.map((e) => [e.tipo, e]));
  const enviado = (t: TipoMensagem) => Boolean(registro.get(t)?.enviadaEm);
  const podeTentar = (t: TipoMensagem) => {
    const r = registro.get(t);
    return !r || (!r.enviadaEm && r.tentativas < MAX_TENTATIVAS);
  };

  const criado = new Date(pedido.criadoEm).getTime();
  const emAberto = pedido.status === "aguardando" || pedido.status === "expirado";
  const pago = pedido.status === "pago" || pedido.status === "entregue";
  const lembreteOk = pedido.aceitaMsgs && emAberto && contexto.temEstoque && !contexto.pagouOutroDepois;

  const devidas: TipoMensagem[] = [];
  // "Recebido" só enquanto está em aberto: quem já pagou recebe direto o "pago".
  if (emAberto) devidas.push("recebido");
  if (lembreteOk && agora.getTime() >= criado + HORA_MS) devidas.push("lembrete1h");
  if (lembreteOk && agora.getTime() >= criado + 24 * HORA_MS && enviado("lembrete1h")) devidas.push("lembrete24h");
  if (pago) devidas.push("pago", "aviso_venda");
  if (pedido.status === "pago_sem_peca") devidas.push("aviso_sem_peca");

  const janela = dentroDaJanela(agora);
  return devidas.filter((t) => podeTentar(t) && (janela || ehAvisoAoDono(t)));
}
