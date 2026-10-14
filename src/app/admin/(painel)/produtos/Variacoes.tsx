"use client";

import { useActionState, useOptimistic, useTransition } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import type { Variacao } from "@/lib/loja/tipos";
import { estoqueAction, novaVariacaoAction, type Estado } from "./actions";
import { botaoAmareloCls, campoCls, rotuloCls } from "./estilos";

function Linha({ v }: { v: Variacao }) {
  const [estoque, mudar] = useOptimistic(v.estoque, (atual, delta: 1 | -1) => Math.max(0, atual + delta));
  const [, iniciar] = useTransition();
  const tocar = (delta: 1 | -1) =>
    iniciar(async () => {
      mudar(delta);
      await estoqueAction(v.id, delta);
    });

  const botao =
    "inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-white text-black disabled:border-zinc-300 disabled:text-zinc-300";
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate font-semibold">
          {v.modelo} · {v.tamanho}
        </p>
        {estoque === 0 ? <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-600">Esgotado</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button type="button" aria-label={`Tirar 1 de ${v.modelo} ${v.tamanho}`} disabled={estoque === 0} onClick={() => tocar(-1)} className={botao}>
          <Minus className="h-5 w-5" />
        </button>
        <span className="w-8 text-center text-2xl font-black tabular-nums">{estoque}</span>
        <button type="button" aria-label={`Pôr 1 de ${v.modelo} ${v.tamanho}`} onClick={() => tocar(1)} className={botao}>
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </li>
  );
}

export function Variacoes({ produtoId, variacoes }: { produtoId: number; variacoes: Variacao[] }) {
  const [estado, acao, salvando] = useActionState<Estado, FormData>(novaVariacaoAction.bind(null, produtoId), null);
  const modelos = [...new Set(variacoes.map((v) => v.modelo))];

  return (
    <div className="grid gap-5">
      {variacoes.length ? (
        <ul className="divide-y divide-zinc-200">
          {variacoes.map((v) => (
            <Linha key={v.id} v={v} />
          ))}
        </ul>
      ) : (
        <p className="text-zinc-600">Nenhum tamanho ainda. Sem tamanho, o produto aparece esgotado.</p>
      )}

      <form action={acao} className="grid gap-4 rounded-2xl bg-zinc-50 p-4">
        <p className="font-heading text-lg font-black uppercase tracking-tight">Novo tamanho</p>
        <label className="grid gap-2">
          <span className={rotuloCls}>Modelo</span>
          <input
            required
            name="modelo"
            list={`modelos-${produtoId}`}
            placeholder="Tradicional"
            defaultValue={modelos.at(-1) ?? ""}
            maxLength={40}
            className={campoCls}
          />
          <datalist id={`modelos-${produtoId}`}>
            {modelos.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-2">
            <span className={rotuloCls}>Tamanho</span>
            <input required name="tamanho" placeholder="M" maxLength={10} autoCapitalize="characters" className={campoCls} />
          </label>
          <label className="grid gap-2">
            <span className={rotuloCls}>Estoque</span>
            <input name="estoque" type="number" inputMode="numeric" min={0} max={9999} step={1} defaultValue={0} className={campoCls} />
          </label>
        </div>
        {estado?.erro ? <p className="text-sm font-semibold text-red-600">{estado.erro}</p> : null}
        {estado?.ok ? <p className="text-sm font-semibold text-green-700">{estado.ok}</p> : null}
        <button type="submit" disabled={salvando} className={botaoAmareloCls}>
          {salvando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          Adicionar
        </button>
      </form>
    </div>
  );
}
