"use client";

import { useFormStatus } from "react-dom";

function Botao({ ativo }: { ativo: boolean }) {
  const { pending } = useFormStatus();
  // Mostra já o estado novo enquanto salva.
  const ligado = pending ? !ativo : ativo;
  return (
    <button
      type="submit"
      disabled={pending}
      role="switch"
      aria-checked={ligado}
      aria-label={ligado ? "Ativo na loja. Toque para ocultar." : "Oculto. Toque para mostrar na loja."}
      className="flex shrink-0 flex-col items-center gap-1 px-1 disabled:opacity-70"
    >
      <span
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
          ligado ? "bg-caicara-yellow" : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute h-6 w-6 rounded-full bg-black transition-transform ${ligado ? "translate-x-7" : "translate-x-1"}`}
        />
      </span>
      <span className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-600">{ligado ? "Ativo" : "Oculto"}</span>
    </button>
  );
}

export function ChaveAtivo({ ativo, acao }: { ativo: boolean; acao: () => Promise<void> }) {
  return (
    <form action={acao}>
      <Botao ativo={ativo} />
    </form>
  );
}
