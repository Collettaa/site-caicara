import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EscolhaVariacao } from "@/components/loja/EscolhaVariacao";
import { precoLinha } from "@/components/loja/reais";
import { ProvaSocial } from "@/components/loja/ProvaSocial";
import { Retirada } from "@/components/loja/Retirada";
import { getDb } from "@/lib/loja/db";
import { buscarPorSlug } from "@/lib/loja/produtos";

// Estoque muda a toda hora: lê o banco a cada visita.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const produto = buscarPorSlug(getDb(), slug);
  if (!produto) return { title: "Loja" };
  return {
    title: produto.nome,
    description: `${produto.nome} · ${precoLinha(produto.preco, produto.precoPix)}. Retira no box da Caiçara Fit.`,
    alternates: { canonical: `/loja/${produto.slug}` },
    openGraph: produto.fotos[0] ? { images: [{ url: produto.fotos[0] }] } : undefined,
  };
}

export default async function ProdutoPage({ params }: Props) {
  const { slug } = await params;
  const produto = buscarPorSlug(getDb(), slug);
  if (!produto) notFound();

  return (
    <section className="loja-areia py-8 sm:py-12">
      <div className="container">
        <Link href="/loja" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-black">
          <ArrowLeft className="h-4 w-4" />
          Loja
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* Galeria: no celular arrasta pro lado; no computador, uma embaixo da outra. */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:overflow-visible lg:px-0">
            {produto.fotos.map((foto, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={foto}
                src={foto}
                alt={`${produto.nome}, foto ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                className="aspect-[4/5] w-[85%] shrink-0 snap-center bg-zinc-200 object-cover lg:w-full"
              />
            ))}
          </div>

          <div className="grid gap-6 lg:sticky lg:top-28">
            <div>
              <h1 className="font-heading text-5xl font-bold uppercase leading-[0.9] tracking-[-0.01em] sm:text-6xl">{produto.nome}</h1>
              {produto.descricao ? <p className="mt-4 max-w-prose text-lg leading-relaxed text-zinc-700">{produto.descricao}</p> : null}
            </div>

            <EscolhaVariacao
              produto={{
                slug: produto.slug,
                nome: produto.nome,
                preco: produto.preco,
                precoPix: produto.precoPix,
                parcelasMax: produto.parcelasMax,
                foto: produto.fotos[0] ?? "",
              }}
              variacoes={produto.variacoes.map((v) => ({
                id: v.id,
                modelo: v.modelo,
                tamanho: v.tamanho,
                estoque: v.estoque,
              }))}
            />

            <ProvaSocial />
            <Retirada />
          </div>
        </div>
      </div>
    </section>
  );
}
