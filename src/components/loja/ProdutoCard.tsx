import Link from "next/link";
import type { ProdutoComVariacoes } from "@/lib/loja/produtos";
import { Etiqueta } from "./Etiqueta";

export function ProdutoCard({ produto, destaque = false }: { produto: ProdutoComVariacoes; destaque?: boolean }) {
  const esgotado = produto.variacoes.every((v) => v.estoque <= 0);
  const foto = produto.fotos[0];

  return (
    <Link href={`/loja/${produto.slug}`} className="group block focus-visible:outline-none">
      <div className="relative mt-8 overflow-visible">
        <div className="aspect-[4/5] overflow-hidden bg-zinc-200 group-focus-visible:ring-4 group-focus-visible:ring-black">
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={foto}
              alt={produto.nome}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading={destaque ? "eager" : "lazy"}
            />
          ) : null}
        </div>
        <div className="absolute -top-2 right-3">
          {esgotado ? (
            <div className="etiqueta-wrap etiqueta-pequena">
              <span className="etiqueta-cordao" aria-hidden="true" />
              <div className="etiqueta">
                <span className="etiqueta-preco">Esgotou</span>
                <span className="etiqueta-nota">volta logo</span>
              </div>
            </div>
          ) : (
            <Etiqueta preco={produto.preco} precoPix={produto.precoPix} nota={produto.etiqueta || "feita no box"} balanca={destaque} pequena />
          )}
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h2 className="font-heading text-3xl font-bold uppercase leading-none tracking-tight">{produto.nome}</h2>
        <span className="shrink-0 text-sm font-semibold underline decoration-2 underline-offset-4 group-hover:decoration-[#f8d808]">
          Escolher tamanho
        </span>
      </div>
    </Link>
  );
}
