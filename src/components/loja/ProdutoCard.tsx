import Link from "next/link";
import type { ProdutoComVariacoes } from "@/lib/loja/produtos";
import { Etiqueta } from "./Etiqueta";

export function ProdutoCard({ produto, destaque = false }: { produto: ProdutoComVariacoes; destaque?: boolean }) {
  const foto = produto.fotos[0];

  return (
    <Link href={`/loja/${produto.slug}`} className="group block focus-visible:outline-none">
      <div className="relative mt-8 overflow-visible">
        <div className="aspect-[11/10] overflow-hidden bg-zinc-200 group-focus-visible:ring-4 group-focus-visible:ring-black">
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={foto}
              alt={produto.nome}
              className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
              loading={destaque ? "eager" : "lazy"}
            />
          ) : null}
        </div>
        <div className="absolute -top-2 right-3">
          <EtiquetaDoProduto produto={produto} pequena />
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="font-heading text-3xl font-bold uppercase leading-none tracking-tight">{produto.nome}</h3>
        <span className="shrink-0 text-sm font-semibold underline decoration-2 underline-offset-4 group-hover:decoration-[#f8d808]">
          Escolher tamanho
        </span>
      </div>
    </Link>
  );
}

/** Etiqueta com o preço do produto, ou "Esgotou" quando não sobra nenhum tamanho. */
export function EtiquetaDoProduto({
  produto,
  balanca = false,
  pequena = false,
}: {
  produto: ProdutoComVariacoes;
  balanca?: boolean;
  pequena?: boolean;
}) {
  const esgotado = produto.variacoes.every((v) => v.estoque <= 0);
  if (esgotado) {
    return (
      <div className={`etiqueta-wrap ${balanca ? "etiqueta-balanca" : ""} ${pequena ? "etiqueta-pequena" : ""}`}>
        <span className="etiqueta-cordao" aria-hidden="true" />
        <div className="etiqueta">
          <span className="etiqueta-preco">Esgotou</span>
          <span className="etiqueta-nota">volta logo</span>
        </div>
      </div>
    );
  }
  return (
    <Etiqueta
      preco={produto.preco}
      precoPix={produto.precoPix}
      nota={produto.etiqueta || "feita no box"}
      balanca={balanca}
      pequena={pequena}
    />
  );
}
