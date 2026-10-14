"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCarrinho } from "./useCarrinho";

/** Atalho discreto pro carrinho: ícone e, se tiver peça, a contagem. */
export function BotaoCarrinho({ className = "" }: { className?: string }) {
  const { pecas, pronto } = useCarrinho();
  const n = pronto ? pecas : 0;
  return (
    <Link
      href="/loja/carrinho"
      aria-label={n > 0 ? `Ver carrinho, ${n} ${n === 1 ? "peça" : "peças"}` : "Ver carrinho"}
      className={`inline-flex h-10 min-w-10 items-center justify-center gap-1.5 border border-white/50 px-2.5 text-sm font-bold text-white hover:border-white ${className}`}
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      {n > 0 ? <span className="bg-[#f8d808] px-1.5 leading-5 text-black">{n}</span> : null}
    </Link>
  );
}
