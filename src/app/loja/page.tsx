import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { ProdutoCard } from "@/components/loja/ProdutoCard";
import { ProvaSocial } from "@/components/loja/ProvaSocial";
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
    <div className="loja-areia">
      <section className="bg-black text-white">
        <div className="container flex flex-wrap items-end justify-between gap-6 py-12 sm:py-16">
          <div>
            <h1 className="font-heading text-[clamp(3.5rem,16vw,7.5rem)] font-bold uppercase leading-[0.85] tracking-[-0.02em]">
              Seja
              <br />Caiçara.
            </h1>
            <p className="mt-5 max-w-md text-lg text-zinc-300">
              Camisetas feitas pra quem treina com a gente. Paga aqui e pega no próximo treino, em São Vicente.
            </p>
          </div>
          <Link
            href="/loja/carrinho"
            className="inline-flex h-12 items-center justify-center gap-2 bg-[#f8d808] px-6 text-sm font-bold text-black focus-visible:outline focus-visible:outline-4 focus-visible:outline-white"
          >
            <ShoppingBag className="h-5 w-5" />
            Ver carrinho
          </Link>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container grid gap-14">
          {produtos.length === 0 ? (
            <p className="max-w-md text-lg text-zinc-700">
              A próxima camiseta ainda tá na gráfica. Enquanto isso, acompanha no Instagram.
            </p>
          ) : (
            <div className="grid gap-14 sm:grid-cols-2 lg:grid-cols-3">
              {produtos.map((p, i) => (
                <ProdutoCard key={p.id} produto={p} destaque={i === 0} />
              ))}
            </div>
          )}
          <div className="grid max-w-xl gap-5">
            <ProvaSocial />
            <Retirada />
          </div>
        </div>
      </section>
    </div>
  );
}
