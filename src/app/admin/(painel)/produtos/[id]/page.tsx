import type { Metadata } from "next";
import { exigirAdmin } from "@/lib/admin-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getDb } from "@/lib/loja/db";
import { buscarPorId } from "@/lib/loja/produtos";
import { ativoAction } from "../actions";
import { ChaveAtivo } from "../ChaveAtivo";
import { FormProduto } from "../FormProduto";
import { Fotos } from "../Fotos";
import { Variacoes } from "../Variacoes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Produto" };

const NOVO = { nome: "", descricao: "", preco: null, precoPix: null, parcelasMax: 1, etiqueta: "" };

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-heading text-2xl font-black uppercase tracking-tight">{titulo}</h2>
      {children}
    </div>
  );
}

export default async function ProdutoAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirAdmin();
  const { id } = await params;
  const novo = id === "novo";
  const produto = novo ? null : /^\d+$/.test(id) ? buscarPorId(getDb(), Number(id)) : null;
  if (!novo && !produto) notFound();

  return (
    <section className="bg-zinc-50 py-8 sm:py-12">
      <div className="container grid max-w-2xl gap-6">
        <Link
          href="/admin/produtos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Produtos
        </Link>

        <div className="flex items-start justify-between gap-4">
          <h1 className="min-w-0 break-words font-heading text-4xl font-black uppercase tracking-tight sm:text-5xl">
            {produto ? produto.nome : "Novo produto"}
          </h1>
          {produto ? <ChaveAtivo ativo={produto.ativo} acao={ativoAction.bind(null, produto.id, !produto.ativo)} /> : null}
        </div>

        {produto?.ativo ? (
          <Link
            href={`/loja/${produto.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 underline"
          >
            Ver na loja
            <ExternalLink className="h-4 w-4" />
          </Link>
        ) : produto ? (
          <p className="text-sm text-zinc-600">Oculto: não aparece na loja. Liga a chave quando estiver pronto.</p>
        ) : (
          <p className="text-sm text-zinc-600">Depois de criar, você põe as fotos e os tamanhos. Ele nasce oculto.</p>
        )}

        <FormProduto id={produto ? produto.id : "novo"} valores={produto ?? NOVO} />

        {produto ? (
          <>
            <Bloco titulo="Fotos">
              <Fotos produtoId={produto.id} fotos={produto.fotos} />
            </Bloco>
            <Bloco titulo="Tamanhos e estoque">
              <Variacoes produtoId={produto.id} variacoes={produto.variacoes} />
            </Bloco>
          </>
        ) : null}
      </div>
    </section>
  );
}
