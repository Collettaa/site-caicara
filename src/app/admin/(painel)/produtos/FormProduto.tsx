"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { salvarProdutoAction, type Estado } from "./actions";
import { botaoAmareloCls, campoCls, rotuloCls } from "./estilos";

/** Centavos → "70" ou "65,50" para o campo. */
const paraCampo = (c: number | null | undefined) =>
  c == null ? "" : c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2).replace(".", ",");

export interface ValoresProduto {
  nome: string;
  descricao: string;
  preco: number | null;
  precoPix: number | null;
  parcelasMax: number;
}

export function FormProduto({ id, valores }: { id: number | "novo"; valores: ValoresProduto }) {
  const [estado, acao, salvando] = useActionState<Estado, FormData>(salvarProdutoAction, null);

  return (
    <form action={acao} className="grid gap-5 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <input type="hidden" name="id" value={String(id)} />

      <label className="grid gap-2">
        <span className={rotuloCls}>Nome</span>
        <input required name="nome" defaultValue={valores.nome} maxLength={80} className={campoCls} />
      </label>

      <label className="grid gap-2">
        <span className={rotuloCls}>Descrição curta</span>
        <textarea
          name="descricao"
          defaultValue={valores.descricao}
          maxLength={500}
          rows={3}
          className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-lg outline-none focus:border-black"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="grid gap-2">
          <span className={rotuloCls}>Preço (R$)</span>
          <input
            required
            name="preco"
            inputMode="decimal"
            placeholder="70"
            defaultValue={paraCampo(valores.preco)}
            className={campoCls}
          />
        </label>
        <label className="grid gap-2">
          <span className={rotuloCls}>No Pix (R$)</span>
          <input
            name="precoPix"
            inputMode="decimal"
            placeholder="opcional"
            defaultValue={paraCampo(valores.precoPix)}
            className={campoCls}
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className={rotuloCls}>Parcelas no cartão</span>
        <select name="parcelasMax" defaultValue={String(valores.parcelasMax)} className={campoCls}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n === 1 ? "Só à vista (1x)" : `Até ${n}x`}
            </option>
          ))}
        </select>
      </label>

      {estado?.erro ? <p className="text-sm font-semibold text-red-600">{estado.erro}</p> : null}
      {estado?.ok ? <p className="text-sm font-semibold text-green-700">{estado.ok}</p> : null}

      <button
        type="submit"
        disabled={salvando}
        className={botaoAmareloCls}
      >
        {salvando ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {id === "novo" ? "Criar produto" : "Salvar"}
      </button>
    </form>
  );
}
