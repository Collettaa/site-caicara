"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/**
 * Botão de formulário grande, que trava enquanto a action roda (evita toque duplo no balcão).
 * Com `confirmar`, pergunta antes de enviar.
 */
export function BotaoAcao({
  acao,
  children,
  className,
  confirmar,
}: {
  acao: () => Promise<void>;
  children: React.ReactNode;
  className: string;
  confirmar?: string;
}) {
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
    >
      <Botao className={className}>{children}</Botao>
    </form>
  );
}

function Botao({ children, className }: { children: React.ReactNode; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-14 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold uppercase tracking-[0.12em] disabled:opacity-60 ${className}`}
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
      {children}
    </button>
  );
}
