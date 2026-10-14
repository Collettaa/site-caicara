import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { precoLinha } from "@/components/loja/reais";
import { getDb } from "@/lib/loja/db";
import { listarTodos } from "@/lib/loja/produtos";
import { ativoAction } from "./actions";
import { ChaveAtivo } from "./ChaveAtivo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Produtos" };

export default function ProdutosPage() {
  const produtos = listarTodos(getDb());

  return (
    <section className="bg-zinc-50 py-8 sm:py-12">
      <div className="container grid max-w-2xl gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-4xl font-black uppercase tracking-tight sm:text-5xl">Produtos</h1>
          <Link
            href="/admin/produtos/novo"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-caicara-yellow px-6 text-sm font-bold uppercase tracking-[0.14em] text-black"
          >
            <Plus className="h-5 w-5" />
            Novo
          </Link>
        </div>

        {produtos.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-lg text-zinc-600">Nenhum produto ainda.</p>
        ) : (
          <ul className="grid gap-4">
            {produtos.map((p) => {
              const estoque = p.variacoes.filter((v) => v.ativo).reduce((s, v) => s + v.estoque, 0);
              const foto = p.fotos[0];
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-4 rounded-[1.5rem] border border-zinc-200 bg-white p-3 shadow-sm"
                >
                  <Link href={`/admin/produtos/${p.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-100">
                      {foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={foto} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-heading text-xl font-black uppercase tracking-tight">{p.nome}</p>
                      <p className="text-sm text-zinc-600">{precoLinha(p.preco, p.precoPix)}</p>
                      <p className={`text-sm font-semibold ${estoque === 0 ? "text-red-600" : "text-zinc-800"}`}>
                        {estoque === 0 ? "Sem estoque" : `${estoque} em estoque`}
                      </p>
                    </div>
                  </Link>
                  <ChaveAtivo ativo={p.ativo} acao={ativoAction.bind(null, p.id, !p.ativo)} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
