import Link from "next/link";
import type { ProdutoComVariacoes } from "@/lib/loja/produtos";
import { precoLinha } from "./reais";

export function ProdutoCard({ produto }: { produto: ProdutoComVariacoes }) {
  const esgotado = produto.variacoes.every((v) => v.estoque <= 0);
  const foto = produto.fotos[0];

  return (
    <Link
      href={`/loja/${produto.slug}`}
      className="group block overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-xl shadow-zinc-950/5 transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-square bg-zinc-100">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt={produto.nome} className="h-full w-full object-cover" loading="lazy" />
        ) : null}
        {esgotado ? (
          <span className="absolute left-4 top-4 rounded-full bg-black px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
            Esgotado
          </span>
        ) : null}
      </div>
      <div className="p-5">
        <h2 className="font-heading text-2xl font-black uppercase tracking-tight">{produto.nome}</h2>
        <p className="mt-1 text-lg font-semibold text-zinc-700">{precoLinha(produto.preco, produto.precoPix)}</p>
        <span className="mt-4 inline-flex rounded-full bg-caicara-yellow px-5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-black">
          Ver tamanhos
        </span>
      </div>
    </Link>
  );
}
