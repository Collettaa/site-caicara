// Tipos da loja. No banco as colunas são snake_case; aqui, camelCase.
// Dinheiro sempre em centavos inteiros. Datas em ISO 8601 UTC (texto).

export type StatusPedido = "aguardando" | "pago" | "entregue" | "expirado" | "cancelado" | "pago_sem_peca";

export type Forma = "pix" | "cartao1" | "cartao2" | "balcao_dinheiro" | "balcao_pix" | "balcao_cartao";

export type TipoMensagem = "recebido" | "lembrete1h" | "lembrete24h" | "pago" | "aviso_venda" | "aviso_sem_peca";

export type Origem = "site" | "balcao";

export interface Produto {
  id: number;
  slug: string;
  nome: string;
  descricao: string;
  preco: number;
  precoPix: number | null;
  parcelasMax: number;
  ativo: boolean;
  fotos: string[];
  criadoEm: string;
}

export interface Variacao {
  id: number;
  produtoId: number;
  modelo: string;
  tamanho: string;
  estoque: number;
  ordem: number;
  ativo: boolean;
}

export interface Pedido {
  id: number;
  codigo: string;
  nome: string;
  whatsapp: string;
  aceitaMsgs: boolean;
  forma: Forma;
  origem: Origem;
  status: StatusPedido;
  total: number;
  liquido: number | null;
  asaasId: string | null;
  asaasParcelamentoId: string | null;
  pixQr: string | null;
  pixCopiaCola: string | null;
  invoiceUrl: string | null;
  reservadoAte: string | null;
  criadoEm: string;
  pagoEm: string | null;
  entregueEm: string | null;
}

export interface ItemPedido {
  id: number;
  pedidoId: number;
  variacaoId: number;
  qtd: number;
  precoUnit: number;
  /** Ex.: "Camiseta Caiçara · Baby look M" */
  descricao: string;
}

export interface Mensagem {
  id: number;
  pedidoId: number;
  tipo: TipoMensagem;
  tentativas: number;
  enviadaEm: string | null;
  erro: string | null;
}
