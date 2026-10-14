"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { entrarAction, type EstadoLogin } from "./actions";

export function LoginForm() {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(entrarAction, null);

  return (
    <form
      action={acao}
      className="mx-auto grid w-full max-w-sm gap-5 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5 sm:p-8"
    >
      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">Senha</span>
        <input
          required
          autoFocus
          name="senha"
          type="password"
          autoComplete="current-password"
          className="h-14 rounded-2xl border border-zinc-300 px-4 text-lg outline-none focus:border-black"
        />
      </label>

      {estado?.erro ? <p className="text-sm font-semibold text-red-600">{estado.erro}</p> : null}

      <button
        type="submit"
        disabled={enviando}
        className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-caicara-yellow px-8 text-sm font-bold uppercase tracking-[0.14em] text-black transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Entrar
      </button>
    </form>
  );
}
