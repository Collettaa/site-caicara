// Textos dos avisos da tela de pedidos. A URL só leva o código (`?msg=` / `?erro=`); o texto sai daqui,
// nunca da URL.

export const ABAS_PEDIDOS = ["entregar", "aguardando", "entregues"] as const;
export type Aba = (typeof ABAS_PEDIDOS)[number];

export const abaValida = (v: unknown): Aba => (ABAS_PEDIDOS.includes(v as Aba) ? (v as Aba) : "entregar");

export const MSG = {
  entregue: "Pedido entregue.",
  cancelado: "Pedido cancelado.",
  cancelado_estornar: "Pedido cancelado. Faz o estorno no Asaas.",
  asaas_falhou: "Pedido cancelado. A cobrança no Asaas não cancelou — apaga ela lá.",
} as const;
export type CodigoMsg = keyof typeof MSG;

export const ERRO = {
  invalido: "Pedido inválido.",
  nao_encontrado: "Pedido não encontrado.",
  nao_pago: "Só dá pra entregar pedido pago.",
  entregue: "Pedido entregue não cancela.",
  falhou: "Não deu certo. Tenta de novo.",
} as const;
export type CodigoErro = keyof typeof ERRO;

/** Texto do código vindo da URL; código desconhecido → nada. */
export function textoDe<T extends Record<string, string>>(mapa: T, codigo: string | undefined): string | null {
  return codigo && Object.hasOwn(mapa, codigo) ? mapa[codigo as keyof T] : null;
}
