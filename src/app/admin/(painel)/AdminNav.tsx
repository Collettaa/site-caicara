"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sairAction } from "../login/actions";

const LINKS = [
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/balcao", label: "Balcão" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/aulao", label: "Aulão" },
];

const base =
  "inline-flex h-12 shrink-0 items-center justify-center rounded-full px-5 text-sm font-bold uppercase tracking-[0.12em]";

export function AdminNav() {
  const caminho = usePathname();
  const ativo = (href: string) => (href === "/admin" ? caminho === "/admin" : caminho.startsWith(href));

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      <div className="container flex gap-2 overflow-x-auto py-3">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`${base} ${ativo(l.href) ? "bg-caicara-yellow text-black" : "bg-zinc-800 text-white"}`}
          >
            {l.label}
          </Link>
        ))}
        {/* Rota de arquivo: <a> normal para o navegador baixar. */}
        <a href="/admin/vendas.csv" className={`${base} bg-zinc-800 text-white`}>
          CSV
        </a>
        <form action={sairAction} className="ml-auto shrink-0">
          <button type="submit" className={`${base} border border-zinc-700 text-zinc-300`}>
            Sair
          </button>
        </form>
      </div>
    </nav>
  );
}
