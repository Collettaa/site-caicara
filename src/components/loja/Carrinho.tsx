"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { parcelasPermitidas, precoUnitario } from "@/lib/loja/precos";
import { Checkout } from "./Checkout";
import { precoLinha, reais } from "./reais";
import { MAX_POR_VARIACAO, useCarrinho } from "./useCarrinho";

const botaoQtd =
  "inline-flex h-10 w-10 items-center justify-center border-2 border-black bg-white text-black hover:bg-[#f8d808] disabled:border-zinc-400 disabled:text-zinc-500 disabled:hover:bg-white";

export function Carrinho() {
  const { itens, pronto, mudarQtd, remover, limpar } = useCarrinho();
  const [abrindoPedido, setAbrindoPedido] = useState(false);

  if (!pronto || abrindoPedido) {
    return (
      <div className="flex justify-center py-16 text-zinc-700">
        <Loader2 className="h-6 w-6 motion-safe:animate-spin" aria-label="Carregando" />
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="border-2 border-black bg-white p-8 text-center">
        <p className="font-heading text-3xl font-bold uppercase">Seu carrinho tá vazio.</p>
        <Link
          href="/loja"
          className="mt-6 inline-flex h-14 items-center justify-center bg-black px-8 text-base font-bold text-white hover:bg-zinc-800"
        >
          Ver a loja
        </Link>
      </div>
    );
  }

  const totalPix = itens.reduce((s, i) => s + precoUnitario(i, "pix") * i.qtd, 0);
  const totalCartao = itens.reduce((s, i) => s + precoUnitario(i, "cartao1") * i.qtd, 0);
  const parcelas = parcelasPermitidas(itens);
  const temDesconto = totalPix < totalCartao;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div className="grid gap-4">
        <ul className="grid gap-3">
          {itens.map((item) => (
            <li key={item.variacaoId} className="flex gap-3 border-2 border-black bg-white p-3 sm:gap-4">
              <Link
                href={`/loja/${item.produtoSlug}`}
                tabIndex={-1}
                aria-hidden="true"
                className="h-20 w-20 shrink-0 overflow-hidden bg-white sm:h-24 sm:w-24"
              >
                {item.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.foto} alt="" className="h-full w-full object-contain" />
                ) : null}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                <div>
                  <p className="font-semibold leading-snug text-black">{item.descricao}</p>
                  <p className="text-sm text-zinc-700">{precoLinha(item.preco, item.precoPix)}</p>
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
                    className="ml-auto inline-flex h-10 w-10 items-center justify-center text-zinc-700 hover:bg-red-100 hover:text-black"
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
        <p className="text-sm text-zinc-700">Até {MAX_POR_VARIACAO} peças de cada tamanho por pedido.</p>

        {/* Recibo: valor de cada item no Pix; o total do cartão vem embaixo. */}
        <div className="recibo px-5 pt-5 text-black">
          <p className="font-heading text-xl font-bold uppercase">Resumo</p>
          <ul className="mt-3 grid gap-2 text-sm">
            {itens.map((item) => (
              <li key={item.variacaoId} className="recibo-linha">
                <span className="min-w-0">
                  {item.qtd}× {item.descricao}
                </span>
                <span className="recibo-pontos" aria-hidden="true" />
                <span className="shrink-0 font-semibold">{reais(precoUnitario(item, "pix") * item.qtd)}</span>
              </li>
            ))}
          </ul>
          <div className="recibo-linha mt-4 border-t-2 border-dashed border-zinc-400 pt-4">
            <span className="font-semibold">{temDesconto ? "Total no Pix" : "Total"}</span>
            <span className="recibo-pontos" aria-hidden="true" />
            <span className="shrink-0 bg-[#f8d808] px-2 font-heading text-3xl font-bold">{reais(totalPix)}</span>
          </div>
          <div className="recibo-linha mt-2 text-sm text-zinc-700">
            <span>{temDesconto ? "No cartão" : "Cartão"}{parcelas > 1 ? `, até ${parcelas}x` : ""}</span>
            <span className="recibo-pontos" aria-hidden="true" />
            <span className="shrink-0 font-semibold text-black">{reais(totalCartao)}</span>
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
