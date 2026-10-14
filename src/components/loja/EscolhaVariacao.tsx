"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { Etiqueta } from "./Etiqueta";
import { reais } from "./reais";
import { MAX_POR_VARIACAO, useCarrinho } from "./useCarrinho";

// Estoque baixo aparece de verdade na etiqueta; acima disso não chama atenção.
const ESTOQUE_BAIXO = 3;

export interface OpcaoVariacao {
  id: number;
  modelo: string;
  tamanho: string;
  estoque: number;
}

interface Props {
  produto: {
    slug: string;
    nome: string;
    preco: number;
    precoPix: number | null;
    parcelasMax: number;
    foto: string;
    /** Anotação da etiqueta escolhida no admin; vazia = "feita no box". */
    etiqueta: string;
  };
  variacoes: OpcaoVariacao[];
}

const opcaoClass = (ativo: boolean) =>
  `border-2 px-5 py-3 text-base font-bold transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black ${
    ativo ? "border-black bg-black text-white" : "border-black/25 bg-white text-zinc-900 hover:border-black"
  }`;

export function EscolhaVariacao({ produto, variacoes }: Props) {
  const { itens, adicionar } = useCarrinho();
  const modelos = [...new Set(variacoes.map((v) => v.modelo))];
  const [modelo, setModelo] = useState(modelos[0] ?? "");
  const [variacaoId, setVariacaoId] = useState<number | null>(null);
  const [adicionado, setAdicionado] = useState(false);

  const tamanhos = variacoes.filter((v) => v.modelo === modelo);
  const escolhida = variacoes.find((v) => v.id === variacaoId && v.modelo === modelo) ?? null;
  const noCarrinho = escolhida ? (itens.find((i) => i.variacaoId === escolhida.id)?.qtd ?? 0) : 0;
  const limite = escolhida ? Math.min(MAX_POR_VARIACAO, escolhida.estoque) : 0;
  const cheio = escolhida !== null && noCarrinho >= limite;

  function escolherModelo(m: string) {
    setModelo(m);
    setVariacaoId(null);
    setAdicionado(false);
  }

  function escolherTamanho(id: number) {
    setVariacaoId(id);
    setAdicionado(false);
  }

  function adicionarAoCarrinho() {
    if (!escolhida || cheio) return;
    adicionar({
      variacaoId: escolhida.id,
      produtoSlug: produto.slug,
      descricao: `${produto.nome} · ${escolhida.modelo} ${escolhida.tamanho}`,
      foto: produto.foto,
      preco: produto.preco,
      precoPix: produto.precoPix,
      parcelasMax: produto.parcelasMax,
    });
    setAdicionado(true);
  }

  if (variacoes.length === 0 || variacoes.every((v) => v.estoque <= 0)) {
    return <p className="rounded-2xl bg-zinc-100 p-4 font-semibold text-zinc-700">Esgotado por enquanto. Volta logo.</p>;
  }

  const nota = !escolhida
    ? produto.etiqueta || "feita no box"
    : escolhida.estoque <= ESTOQUE_BAIXO
      ? `restam ${escolhida.estoque} no ${escolhida.tamanho}`
      : `${escolhida.modelo} ${escolhida.tamanho}`;
  const economia = produto.precoPix !== null && produto.precoPix < produto.preco ? produto.preco - produto.precoPix : 0;

  return (
    <div className="grid gap-6">
      <div className="flex items-start gap-5 pt-10">
        <Etiqueta preco={produto.preco} precoPix={produto.precoPix} nota={nota} balanca />
        <div className="grid gap-1 pt-2 text-sm text-zinc-700">
          {economia > 0 ? <p className="font-semibold text-black">Economiza {reais(economia)} no Pix.</p> : null}
          {produto.parcelasMax > 1 ? (
            <p>
              No cartão em até {produto.parcelasMax}x de {reais(Math.ceil(produto.preco / produto.parcelasMax))}.
            </p>
          ) : null}
        </div>
      </div>
      {modelos.length > 1 ? (
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-semibold text-zinc-600">Modelo</legend>
          <div className="flex flex-wrap gap-3">
            {modelos.map((m) => (
              <button key={m} type="button" className={opcaoClass(m === modelo)} onClick={() => escolherModelo(m)}>
                {m}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-semibold text-zinc-600">Tamanho</legend>
        <div className="flex flex-wrap gap-3">
          {tamanhos.map((v) => {
            const esgotado = v.estoque <= 0;
            return (
              <button
                key={v.id}
                type="button"
                disabled={esgotado}
                aria-label={esgotado ? `${v.tamanho}, esgotado` : v.tamanho}
                className={
                  esgotado
                    ? "min-w-16 cursor-not-allowed border-2 border-dashed border-black/15 px-4 py-2 text-base font-bold text-zinc-400"
                    : `min-w-16 ${opcaoClass(v.id === variacaoId)}`
                }
                onClick={() => escolherTamanho(v.id)}
              >
                <span className={esgotado ? "line-through" : undefined}>{v.tamanho}</span>
                {esgotado ? <span className="block text-[10px] font-semibold normal-case">esgotado</span> : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-3">
        <button
          type="button"
          disabled={!escolhida || cheio}
          onClick={adicionarAoCarrinho}
          className="inline-flex h-14 items-center justify-center gap-3 bg-black px-8 text-base font-bold text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#f8d808] disabled:bg-black/40"
        >
          <ShoppingBag className="h-5 w-5" />
          {escolhida ? "Pôr no carrinho" : "Escolhe o tamanho"}
        </button>
        {cheio && !adicionado ? (
          <p className="text-sm font-semibold text-zinc-600">
            Você já tem {noCarrinho} desse tamanho no carrinho. É o máximo por pedido.
          </p>
        ) : null}
        {adicionado ? (
          <div className="flex flex-col items-center gap-3 border-2 border-black bg-[#f8d808] p-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="inline-flex items-center gap-2 font-semibold text-zinc-800">
              <CheckCircle2 className="h-5 w-5" />
              Foi pro carrinho!
            </p>
            <Link
              href="/loja/carrinho"
              className="inline-flex h-11 items-center justify-center bg-black px-6 text-sm font-bold text-white"
            >
              Ver carrinho
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
