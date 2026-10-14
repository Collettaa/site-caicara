import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Carrinho } from "@/components/loja/Carrinho";

export const metadata: Metadata = {
  title: "Carrinho",
  robots: { index: false, follow: false },
};

export default function CarrinhoPage() {
  return (
    <section className="loja-areia py-8 sm:py-12">
      <div className="container">
        <Link href="/loja" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-black">
          <ArrowLeft className="h-4 w-4" />
          Continuar comprando
        </Link>
        <h1 className="mt-4 mb-8 font-heading text-5xl font-bold uppercase leading-[0.95] sm:text-6xl">Carrinho</h1>
        <Carrinho />
      </div>
    </section>
  );
}
