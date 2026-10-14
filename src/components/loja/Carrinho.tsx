"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { parcelasPermitidas, precoUnitario } from "@/lib/loja/precos";
import { Checkout } from "./Checkout";
import { precoLinha, reais } from "./reais";
import { MAX_POR_VARIACAO, useCarrinho } from "./useCarrinho";

const botaoQtd =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-800 transition-colors hover:border-black disabled:opacity-40";

export function Carrinho() {
  const { itens, pronto, mudarQtd, remover, limpar } = useCarrinho();
  const [abrindoPedido, setAbrindoPedido] = useState(false);

  if (!pronto || abrindoPedido) {
    return (
      <div className="flex justify-center py-16 text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="rounded-[2rem] border border-zinc-200 bg-white p-8 text-center">
        <p className="font-heading text-2xl font-black uppercase">Seu carrinho tá vazio</p>
        <Link
          href="/loja"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-caicara-yellow px-8 text-sm font-bold uppercase tracking-[0.14em] text-black"
        >
          Ver a loja
        </Link>
      </div>
    );
  }

  const totalPix = itens.reduce((s, i) => s + precoUnitario(i, "pix") * i.qtd, 0);
  const totalCartao = itens.reduce((s, i) => s + precoUnitario(i, "cartao1") * i.qtd, 0);
  const parcelas = parcelasPermitidas(itens);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div className="grid gap-4">
        <ul className="grid gap-3">
          {itens.map((item) => (
            <li key={item.variacaoId} className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-3">
              <Link href={`/loja/${item.produtoSlug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                {item.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.foto} alt="" className="h-full w-full object-cover" />
                ) : null}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                <div>
                  <p className="font-semibold leading-snug text-zinc-900">{item.descricao}</p>
                  <p className="text-sm text-zinc-500">{precoLinha(item.preco, item.precoPix)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={botaoQtd}
                    aria-label="Tirar uma"
                    onClick={() => mudarQtd(item.variacaoId, item.qtd - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-lg font-bold" aria-live="polite">
                    {item.qtd}
                  </span>
                  <button
                    type="button"
                    className={botaoQtd}
                    aria-label="Pôr mais uma"
                    disabled={item.qtd >= MAX_POR_VARIACAO}
                    onClick={() => mudarQtd(item.variacaoId, item.qtd + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 hover:text-red-600"
                    aria-label={`Tirar ${item.descricao} do carrinho`}
                    onClick={() => remover(item.variacaoId)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-sm text-zinc-500">Até {MAX_POR_VARIACAO} peças de cada tamanho por pedido.</p>

        <div className="grid gap-2 rounded-2xl bg-zinc-950 p-5 text-white">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">No Pix</span>
            <span className="font-heading text-3xl font-black text-caicara-yellow">{reais(totalPix)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">No cartão</span>
            <span className="text-lg font-bold">
              {reais(totalCartao)}
              {parcelas > 1 ? <span className="text-sm font-normal text-zinc-400"> · até {parcelas}x</span> : null}
            </span>
          </div>
        </div>
      </div>

      <Checkout
        itens={itens}
        totalPix={totalPix}
        totalCartao={totalCartao}
        parcelas={parcelas}
        onPedido={() => {
          setAbrindoPedido(true);
          limpar();
        }}
      />
    </div>
  );
}
