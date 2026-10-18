import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { BotaoAcao } from "@/app/admin/(painel)/BotaoAcao";
import { tokenEntregaValido } from "@/lib/entrega-link";
import { getDb } from "@/lib/loja/db";
import { type PedidoComItens, listarPorStatus } from "@/lib/loja/pedidos";
import { entregarProvisorio } from "./actions";
import { Atualizar } from "./Atualizar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrega das camisetas", robots: { index: false, follow: false } };

const hora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const quando = (iso: string | null) => (iso ? hora.format(new Date(iso)).replace(",", "") : "—");

export default async function EntregaPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const { token } = await params;
  if (!tokenEntregaValido(token, new Date())) notFound();
  const { msg } = await searchParams;
  const db = getDb();

  const porNome = (a: PedidoComItens, b: PedidoComItens) => a.nome.localeCompare(b.nome, "pt-BR");
  const paraEntregar = listarPorStatus(db, ["pago"]).sort(porNome);
  const semPeca = listarPorStatus(db, ["pago_sem_peca"]).sort(porNome);
  const entregues = listarPorStatus(db, ["entregue"]).sort((a, b) => (b.entregueEm ?? "").localeCompare(a.entregueEm ?? ""));

  return (
    <div className="container max-w-2xl px-4 py-8 pt-24">
      <Atualizar />
      <h1 className="font-heading text-4xl font-black uppercase tracking-tight">Entrega das camisetas</h1>
      <p className="mt-2 text-zinc-600">
        Aqui só aparece quem já pagou. Entregou a peça? Aperta <b>Entregue</b>. A lista atualiza sozinha.
      </p>

      {msg === "entregue" ? (
        <p className="mt-4 flex items-center gap-2 rounded-2xl bg-green-100 p-4 font-semibold text-green-900">
          <CheckCircle2 className="h-5 w-5" /> Marcado como entregue.
        </p>
      ) : null}
      {msg === "erro" ? (
        <p className="mt-4 rounded-2xl bg-red-100 p-4 font-semibold text-red-800">
          Não deu para marcar. Atualiza a página; se continuar, chama o Gabriel.
        </p>
      ) : null}

      <h2 className="mt-8 font-heading text-2xl font-black uppercase">Para entregar · {paraEntregar.length}</h2>
      {paraEntregar.length === 0 ? <p className="mt-3 text-zinc-500">Ninguém esperando.</p> : null}
      <ul className="mt-3 grid gap-3">
        {paraEntregar.map((p) => (
          <li key={p.id} className="rounded-3xl border border-zinc-200 bg-white p-4">
            <Cartao p={p} legenda={`pago ${quando(p.pagoEm)}`} />
            <div className="mt-4">
              <BotaoAcao
                acao={entregarProvisorio.bind(null, token, p.id)}
                confirmar={`Entregar para ${p.nome}?`}
                className="bg-caicara-yellow text-black"
              >
                Entregue
              </BotaoAcao>
            </div>
          </li>
        ))}
      </ul>

      {semPeca.length > 0 ? (
        <>
          <h2 className="mt-8 font-heading text-2xl font-black uppercase text-red-700">Pago sem peça · {semPeca.length}</h2>
          <p className="mt-1 text-sm text-zinc-600">Pagou, mas o tamanho acabou. Não entrega: chama o Gabriel.</p>
          <ul className="mt-3 grid gap-3">
            {semPeca.map((p) => (
              <li key={p.id} className="rounded-3xl border-2 border-red-500 bg-red-50 p-4">
                <Cartao p={p} legenda={`pago ${quando(p.pagoEm)}`} />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h2 className="mt-8 font-heading text-2xl font-black uppercase text-zinc-500">Já entregues · {entregues.length}</h2>
      <ul className="mt-3 grid gap-2">
        {entregues.map((p) => (
          <li key={p.id} className="rounded-2xl bg-zinc-100 p-3 text-zinc-600">
            <Cartao p={p} legenda={`entregue ${quando(p.entregueEm)}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Cartao({ p, legenda }: { p: PedidoComItens; legenda: string }) {
  return (
    <>
      <p className="text-lg font-bold leading-tight">{p.nome}</p>
      <ul className="mt-1">
        {p.itens.map((i) => (
          <li key={i.id}>
            {i.qtd}x {i.descricao}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-sm text-zinc-500">{legenda}</p>
    </>
  );
}
