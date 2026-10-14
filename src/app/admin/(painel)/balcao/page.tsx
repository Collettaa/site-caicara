import type { Metadata } from "next";
import { getDb } from "@/lib/loja/db";
import { listarTodos } from "@/lib/loja/produtos";
import { FormBalcao, type ProdutoBalcao } from "./FormBalcao";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Balcão" };

export default function BalcaoPage() {
  // Vende o que tem na prateleira, mesmo de produto oculto na loja.
  const produtos: ProdutoBalcao[] = listarTodos(getDb())
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      oculto: !p.ativo,
      preco: p.preco,
      precoPix: p.precoPix,
      variacoes: p.variacoes
        .filter((v) => v.estoque > 0)
        .map((v) => ({ id: v.id, nome: `${v.modelo} ${v.tamanho}`, estoque: v.estoque })),
    }))
    .filter((p) => p.variacoes.length > 0);

  return (
    <div className="container py-6">
      <h1 className="font-heading text-4xl font-black uppercase tracking-tight">Venda no balcão</h1>
      <p className="mt-1 text-zinc-600">Baixa o estoque e já entra como entregue.</p>
      {produtos.length === 0 ? (
        <p className="mt-8 text-center text-zinc-500">Nenhuma peça em estoque.</p>
      ) : (
        <FormBalcao produtos={produtos} />
      )}
    </div>
  );
}
