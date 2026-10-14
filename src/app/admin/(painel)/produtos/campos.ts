// Leitura dos campos do formulário de produto. Puro, sem Next: testável.

import type { DadosAtualizacao, DadosVariacao } from "@/lib/loja/produtos";

/** "70", "70,00", "65,5", "R$ 1.234,56" → centavos. Vazio → null. Inválido → NaN. */
export function centavosDeReais(texto: string): number | null {
  let s = texto.replace(/R\$|\s/gi, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  return Math.round(Number(s) * 100);
}

type Resultado<T> = { ok: true; dados: T } | { ok: false; erro: string };

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? "").trim();

export function lerDadosProduto(fd: FormData): Resultado<Required<Omit<DadosAtualizacao, "fotos">>> {
  const nome = texto(fd, "nome");
  if (!nome) return { ok: false, erro: "Põe o nome do produto." };
  if (nome.length > 80) return { ok: false, erro: "Nome comprido demais (máximo 80 letras)." };

  const descricao = texto(fd, "descricao");
  if (descricao.length > 500) return { ok: false, erro: "Descrição comprida demais (máximo 500 letras)." };

  const preco = centavosDeReais(texto(fd, "preco"));
  if (preco === null || !Number.isInteger(preco) || preco < 1)
    return { ok: false, erro: "Preço inválido. Escreve assim: 70 ou 70,00." };

  const precoPix = centavosDeReais(texto(fd, "precoPix"));
  if (precoPix !== null && (!Number.isInteger(precoPix) || precoPix < 1))
    return { ok: false, erro: "Preço no Pix inválido. Escreve assim: 65 ou 65,00 (ou deixa vazio)." };

  const parcelasMax = Number(texto(fd, "parcelasMax"));
  if (!Number.isInteger(parcelasMax) || parcelasMax < 1 || parcelasMax > 12)
    return { ok: false, erro: "Parcelas: de 1 a 12." };

  return { ok: true, dados: { nome, descricao, preco, precoPix, parcelasMax } };
}

export function lerVariacao(fd: FormData): Resultado<DadosVariacao> {
  const modelo = texto(fd, "modelo");
  const tamanho = texto(fd, "tamanho").toUpperCase();
  if (!modelo || !tamanho) return { ok: false, erro: "Põe o modelo e o tamanho." };
  if (modelo.length > 40 || tamanho.length > 10) return { ok: false, erro: "Modelo ou tamanho comprido demais." };
  const bruto = texto(fd, "estoque");
  const estoque = bruto === "" ? 0 : Number(bruto);
  if (!Number.isInteger(estoque) || estoque < 0 || estoque > 9999)
    return { ok: false, erro: "Estoque: um número inteiro, 0 ou mais." };
  return { ok: true, dados: { modelo, tamanho, estoque } };
}
