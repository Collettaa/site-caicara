"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, Minus, Plus } from "lucide-react";
import { reais } from "@/components/loja/reais";
import { type EstadoBalcao, balcaoAction } from "../actions";

export interface ProdutoBalcao {
  id: number;
  nome: string;
  oculto: boolean;
  preco: number;
  precoPix: number | null;
  variacoes: { id: number; nome: string; estoque: number }[];
}

type FormaBalcao = "balcao_dinheiro" | "balcao_pix" | "balcao_cartao";
const FORMAS: { id: FormaBalcao; label: string }[] = [
  { id: "balcao_dinheiro", label: "Dinheiro" },
  { id: "balcao_pix", label: "Pix na hora" },
  { id: "balcao_cartao", label: "Maquininha" },
];

export function FormBalcao({ produtos }: { produtos: ProdutoBalcao[] }) {
  const [estado, acao, enviando] = useActionState<EstadoBalcao, FormData>(
    (_anterior, formData) => balcaoAction(formData),
    null,
  );

  return (
    <form action={acao} className="mt-5">
      {estado?.ok ? (
        <p className="mb-4 flex items-center gap-2 rounded-2xl bg-green-100 p-4 font-semibold text-green-900">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {estado.ok}
        </p>
      ) : null}
      {estado?.erro ? <p className="mb-4 rounded-2xl bg-red-100 p-4 font-semibold text-red-800">{estado.erro}</p> : null}
      {/* Depois de uma venda registrada, a chave nova zera as quantidades e o nome. */}
      <Campos key={estado?.ok ? estado.vez : 0} produtos={produtos} enviando={enviando} />
    </form>
  );
}

function Campos({ produtos, enviando }: { produtos: ProdutoBalcao[]; enviando: boolean }) {
  const [qtds, setQtds] = useState<Record<number, number>>({});
  const [forma, setForma] = useState<FormaBalcao | null>(null);

  const mudar = (id: number, delta: number, max: number) =>
    setQtds((q) => ({ ...q, [id]: Math.min(max, Math.max(0, (q[id] ?? 0) + delta)) }));

  const pecas = Object.values(qtds).reduce((s, n) => s + n, 0);
  const total = produtos.reduce((s, p) => {
    const unit = forma === "balcao_pix" ? (p.precoPix ?? p.preco) : p.preco;
    return s + p.variacoes.reduce((t, v) => t + (qtds[v.id] ?? 0) * unit, 0);
  }, 0);

  return (
    <>
      <div className="grid gap-4">
        {produtos.map((p) => (
          <fieldset key={p.id} className="rounded-3xl border border-zinc-200 bg-white p-4">
            <legend className="px-1 text-lg font-bold">
              {p.nome}
              {p.oculto ? <span className="ml-2 text-xs font-semibold uppercase text-zinc-500">(oculto na loja)</span> : null}
            </legend>
            <ul className="grid gap-2">
              {p.variacoes.map((v) => {
                const q = qtds[v.id] ?? 0;
                return (
                  <li key={v.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{v.nome}</p>
                      <p className="text-sm text-zinc-500">{v.estoque} em estoque</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Tirar ${v.nome}`}
                      onClick={() => mudar(v.id, -1, v.estoque)}
                      disabled={q === 0}
                      className="flex h-14 w-14 items-center justify-center rounded-full border border-zinc-300 bg-white disabled:opacity-30"
                    >
                      <Minus className="h-6 w-6" />
                    </button>
                    <span className="w-8 text-center text-2xl font-black">{q}</span>
                    <button
                      type="button"
                      aria-label={`Pôr ${v.nome}`}
                      onClick={() => mudar(v.id, 1, v.estoque)}
                      disabled={q >= v.estoque}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white disabled:opacity-30"
                    >
                      <Plus className="h-6 w-6" />
                    </button>
                    {q > 0 ? <input type="hidden" name={`qtd_${v.id}`} value={q} /> : null}
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
      </div>

      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">Forma</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {FORMAS.map((f) => (
          <label
            key={f.id}
            className={`flex min-h-14 cursor-pointer items-center justify-center rounded-2xl px-2 text-center text-sm font-bold uppercase tracking-[0.06em] ${
              forma === f.id ? "bg-black text-white" : "bg-white text-zinc-800 ring-1 ring-zinc-300"
            }`}
          >
            <input
              type="radio"
              name="forma"
              value={f.id}
              checked={forma === f.id}
              onChange={() => setForma(f.id)}
              className="sr-only"
            />
            {f.label}
          </label>
        ))}
      </div>

      <label className="mt-6 grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">Nome (opcional)</span>
        <input
          name="nome"
          maxLength={80}
          autoComplete="off"
          className="h-14 rounded-2xl border border-zinc-300 bg-white px-4 text-lg outline-none focus:border-black"
        />
      </label>

      <button
        type="submit"
        disabled={enviando || pecas === 0 || forma === null}
        className="mt-6 inline-flex min-h-16 w-full py-3 items-center justify-center gap-3 rounded-full bg-caicara-yellow px-6 text-base font-bold uppercase tracking-[0.12em] text-black disabled:opacity-50"
      >
        {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Registrar venda{pecas > 0 ? ` · ${pecas} ${pecas === 1 ? "peça" : "peças"} · ${reais(total)}` : ""}
      </button>
    </>
  );
}
