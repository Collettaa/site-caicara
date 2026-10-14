/** Centavos → "R$ 70" (inteiro) ou "R$ 35,50". */
export function reais(centavos: number): string {
  const inteiro = centavos % 100 === 0;
  return `R$ ${(centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: inteiro ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "R$ 70 · R$ 65 no Pix" (ou só "R$ 70" se o Pix não tiver desconto). */
export function precoLinha(preco: number, precoPix: number | null): string {
  if (precoPix === null || precoPix >= preco) return reais(preco);
  return `${reais(preco)} · ${reais(precoPix)} no Pix`;
}
