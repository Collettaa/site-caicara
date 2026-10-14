"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export const MAX_POR_VARIACAO = 5;

const CHAVE = "caicara-carrinho";
const EVENTO = "caicara-carrinho";

export interface ItemCarrinho {
  variacaoId: number;
  produtoSlug: string;
  descricao: string;
  foto: string;
  preco: number;
  precoPix: number | null;
  parcelasMax: number;
  qtd: number;
}

// Navegador sem localStorage (aba anônima, bloqueado): o carrinho vive só na memória da aba.
let semStorage = false;
let memoria = "[]";

function ler(): string {
  if (semStorage) return memoria;
  try {
    return window.localStorage.getItem(CHAVE) ?? "[]";
  } catch {
    semStorage = true;
    return memoria;
  }
}

function gravar(itens: ItemCarrinho[]) {
  memoria = JSON.stringify(itens);
  if (!semStorage) {
    try {
      window.localStorage.setItem(CHAVE, memoria);
    } catch {
      semStorage = true;
    }
  }
  window.dispatchEvent(new Event(EVENTO));
}

function assinar(avisar: () => void) {
  window.addEventListener("storage", avisar);
  window.addEventListener(EVENTO, avisar);
  return () => {
    window.removeEventListener("storage", avisar);
    window.removeEventListener(EVENTO, avisar);
  };
}

const inteiro = (v: unknown, min: number) => (Number.isInteger(v) && (v as number) >= min ? (v as number) : null);

/** Lê o JSON salvo e descarta o que não tiver a forma certa. */
function interpretar(bruto: string): ItemCarrinho[] {
  let dados: unknown;
  try {
    dados = JSON.parse(bruto);
  } catch {
    return [];
  }
  if (!Array.isArray(dados)) return [];
  const itens: ItemCarrinho[] = [];
  for (const d of dados) {
    if (!d || typeof d !== "object") continue;
    const r = d as Record<string, unknown>;
    const variacaoId = inteiro(r.variacaoId, 1);
    const preco = inteiro(r.preco, 0);
    const qtd = inteiro(r.qtd, 1);
    const parcelasMax = inteiro(r.parcelasMax, 1) ?? 1;
    const precoPix = r.precoPix === null ? null : inteiro(r.precoPix, 0);
    if (variacaoId === null || preco === null || qtd === null) continue;
    if (typeof r.descricao !== "string" || typeof r.produtoSlug !== "string") continue;
    if (itens.some((i) => i.variacaoId === variacaoId)) continue;
    itens.push({
      variacaoId,
      produtoSlug: r.produtoSlug,
      descricao: r.descricao,
      foto: typeof r.foto === "string" ? r.foto : "",
      preco,
      precoPix,
      parcelasMax,
      qtd: Math.min(qtd, MAX_POR_VARIACAO),
    });
  }
  return itens;
}

const nada = () => () => {};

export function useCarrinho() {
  const bruto = useSyncExternalStore(assinar, ler, () => "[]");
  // false no HTML do servidor e na hidratação; true depois. Evita piscar "carrinho vazio".
  const pronto = useSyncExternalStore(nada, () => true, () => false);
  const itens = useMemo(() => interpretar(bruto), [bruto]);

  const adicionar = useCallback((item: Omit<ItemCarrinho, "qtd">, qtd = 1) => {
    const atuais = interpretar(ler());
    const existente = atuais.find((i) => i.variacaoId === item.variacaoId);
    if (existente) {
      existente.qtd = Math.min(MAX_POR_VARIACAO, existente.qtd + qtd);
    } else {
      atuais.push({ ...item, qtd: Math.min(MAX_POR_VARIACAO, Math.max(1, qtd)) });
    }
    gravar(atuais);
  }, []);

  /** Quantidade nova; 0 ou menos tira o item. */
  const mudarQtd = useCallback((variacaoId: number, qtd: number) => {
    const atuais = interpretar(ler());
    gravar(
      qtd <= 0
        ? atuais.filter((i) => i.variacaoId !== variacaoId)
        : atuais.map((i) => (i.variacaoId === variacaoId ? { ...i, qtd: Math.min(MAX_POR_VARIACAO, qtd) } : i)),
    );
  }, []);

  const remover = useCallback((variacaoId: number) => mudarQtd(variacaoId, 0), [mudarQtd]);
  const limpar = useCallback(() => gravar([]), []);

  const pecas = itens.reduce((s, i) => s + i.qtd, 0);

  return { itens, pronto, pecas, adicionar, mudarQtd, remover, limpar };
}
