import type { Forma, Produto } from "./tipos";

/** Preço de uma peça na forma escolhida. Pix (site ou balcão) usa `precoPix ?? preco`; o resto, `preco`. */
export function precoUnitario(produto: Pick<Produto, "preco" | "precoPix">, forma: Forma): number {
  if (forma === "pix" || forma === "balcao_pix") return produto.precoPix ?? produto.preco;
  return produto.preco;
}

/** Máximo de parcelas no cartão: o menor `parcelasMax` do carrinho (vazio → 1). */
export function parcelasPermitidas(produtos: Pick<Produto, "parcelasMax">[]): number {
  if (produtos.length === 0) return 1;
  return Math.max(1, Math.min(...produtos.map((p) => p.parcelasMax)));
}
