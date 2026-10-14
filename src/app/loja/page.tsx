import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { ProdutoCard } from "@/components/loja/ProdutoCard";
import { Retirada } from "@/components/loja/Retirada";
import { getDb } from "@/lib/loja/db";
import { listarAtivos } from "@/lib/loja/produtos";

// Estoque muda a toda hora: lê o banco a cada visita.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Loja",
  description: "Camiseta da Caiçara Fit. Paga no site, no Pix ou no cartão, e retira no box em São Vicente.",
  alternates: { canonical: "/loja" },
};

export default function LojaPage() {
  const produtos = listarAtivos(getDb());

  return (
    <>
      <section className="bg-zinc-950 py-12 text-white sm:py-16">
        <div className="container flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-caicara-yellow">Caiçara Fit</span>
            <h1 className="mt-3 font-heading text-6xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl">
              Loja
            </h1>
            <p className="mt-4 max-w-xl text-lg text-zinc-300">Paga aqui, no Pix ou no cartão, e retira no box.</p>
          </div>
          <Link
            href="/loja/carrinho"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-caicara-yellow px-6 text-sm font-bold uppercase tracking-[0.14em] text-black"
          >
            <ShoppingBag className="h-5 w-5" />
            Carrinho
          </Link>
        </div>
      </section>

      <section className="bg-zinc-50 py-12 sm:py-16">
        <div className="container grid gap-10">
          {produtos.length === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center text-lg text-zinc-600">
              Nada na loja agora. Volta logo.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {produtos.map((p) => (
                <ProdutoCard key={p.id} produto={p} />
              ))}
            </div>
          )}
          <div className="max-w-xl">
            <Retirada />
          </div>
        </div>
      </section>
    </>
  );
}
