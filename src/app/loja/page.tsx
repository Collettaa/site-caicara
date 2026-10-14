import type { Metadata } from "next";
import Link from "next/link";
import { BotaoCarrinho } from "@/components/loja/BotaoCarrinho";
import { EtiquetaDoProduto, ProdutoCard } from "@/components/loja/ProdutoCard";
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

const tituloClass =
  "font-heading text-[clamp(3.5rem,16vw,6.5rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em] lg:text-[clamp(4.5rem,7vw,6.5rem)]";

const botaoClass =
  "inline-flex h-14 items-center justify-center gap-2 bg-black px-8 text-base font-bold text-white hover:bg-zinc-800";

export default function LojaPage() {
  const produtos = listarAtivos(getDb());
  const [destaque, ...resto] = produtos;
  const foto = destaque?.fotos[0];

  return (
    <div className="loja-areia overflow-x-clip">
      {/* Topo: o produto é a vitrine. A foto avança sobre a areia de baixo. */}
      <section className="loja-escuro bg-black text-white">
        <div className="container pt-5 lg:pt-8">
          <div className="flex justify-end">
            <BotaoCarrinho />
          </div>
          <div className="grid gap-8 pt-4 lg:grid-cols-2 lg:items-center lg:gap-12 lg:pt-0">
            <div>
              <h1 className={tituloClass}>
                Seja
                <br />
                Caiçara.
              </h1>
              <p className="mt-6 max-w-md text-lg text-zinc-300">
                Camisetas feitas pra quem treina com a gente. Paga aqui e pega no próximo treino.
              </p>
              {destaque ? (
                <div className="mt-10 hidden lg:block">
                  <h2 className="font-heading text-4xl font-bold uppercase leading-none">{destaque.nome}</h2>
                  <Link
                    href={`/loja/${destaque.slug}`}
                    className="mt-6 inline-flex h-14 items-center justify-center bg-[#f8d808] px-8 text-base font-bold text-black hover:bg-white"
                  >
                    Escolher tamanho
                  </Link>
                </div>
              ) : null}
            </div>

            {destaque ? (
              <div className="relative z-10 -mb-16 mt-2 sm:-mb-24 lg:mt-0">
                <div className="aspect-square bg-white">
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={foto} alt={destaque.nome} className="h-full w-full object-contain" loading="eager" />
                  ) : null}
                </div>
                <div className="absolute right-3 top-10 sm:right-5">
                  <EtiquetaDoProduto produto={destaque} balanca />
                </div>
              </div>
            ) : (
              <p className="pb-14 text-lg text-zinc-300 lg:pb-0">
                A próxima camiseta ainda tá na gráfica. Enquanto isso, acompanha no Instagram.
              </p>
            )}
          </div>
        </div>
      </section>

      <div className={`container grid gap-16 pb-16 sm:pb-20 ${destaque ? "pt-24 sm:pt-32" : "pt-12"}`}>
        {destaque ? (
          <div className="lg:hidden">
            <h2 className="font-heading text-4xl font-bold uppercase leading-none">{destaque.nome}</h2>
            <Link href={`/loja/${destaque.slug}`} className={`mt-5 w-full sm:w-auto ${botaoClass}`}>
              Escolher tamanho
            </Link>
          </div>
        ) : null}

        {resto.length > 0 ? (
          <section aria-labelledby="mais-da-loja">
            <h2 id="mais-da-loja" className="font-heading text-3xl font-bold uppercase">
              Mais da loja
            </h2>
            <div className="mt-4 grid gap-14 sm:grid-cols-2 lg:grid-cols-3">
              {resto.map((p) => (
                <ProdutoCard key={p.id} produto={p} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid max-w-xl gap-5">
          <ProvaSocial />
          <Retirada />
        </div>
      </div>
    </div>
  );
}
