import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { BotaoAcao } from "@/app/admin/(painel)/BotaoAcao";
import { Atualizar } from "@/app/entrega/[token]/Atualizar";
import { corridaBambu, listPedidos, tamanhos } from "@/lib/corrida-bambu";
import { getDb } from "@/lib/loja/db";
import {
  estoqueDaLoja,
  linkWhatsapp,
  resumo,
  TREINAO_LINK_ATE,
  type Tamanhos,
  tokenTreinaoValido,
  total,
  type VendaTreinao,
  vendasDaLoja,
  vendasDoBambu,
} from "@/lib/treinao-camisetas";
import { entregarTreinao } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Camisetas do Treinão", robots: { index: false, follow: false } };

const hora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const quando = (iso: string | null) => (iso ? hora.format(new Date(iso)).replace(",", "") : "—");
const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? "";
const descrever = (t: Tamanhos) =>
  tamanhos
    .filter((x) => t[x])
    .map((x) => `${t[x]} ${x}`)
    .join(" · ");

export default async function CamisetasTreinaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ msg?: string; q?: string }>;
}) {
  const { token } = await params;
  if (!tokenTreinaoValido(token, new Date())) notFound();
  const { msg, q } = await searchParams;
  const db = getDb();

  const vendas = [...vendasDaLoja(db), ...vendasDoBambu(await listPedidos())];
  const estoque = estoqueDaLoja(db);
  const r = resumo(vendas);
  const busca = (q ?? "").trim().toLocaleLowerCase("pt-BR");
  const filtrar = (v: VendaTreinao) => !busca || v.nome.toLocaleLowerCase("pt-BR").includes(busca);
  const porNome = (a: VendaTreinao, b: VendaTreinao) => a.nome.localeCompare(b.nome, "pt-BR");

  const paraEntregar = vendas.filter((v) => v.situacao === "entregar").filter(filtrar).sort(porNome);
  const semPeca = vendas.filter((v) => v.situacao === "sem_peca").filter(filtrar).sort(porNome);
  const entregues = vendas
    .filter((v) => v.situacao === "entregue")
    .filter(filtrar)
    .sort((a, b) => (b.entregueEm ?? "").localeCompare(a.entregueEm ?? ""));
  const [ano, mes, dia] = TREINAO_LINK_ATE.split("-");

  return (
    <div className="container max-w-2xl px-4 py-8 pt-24">
      <Atualizar />
      <h1 className="font-heading text-4xl font-black uppercase tracking-tight">Camisetas do Treinão</h1>
      <p className="mt-2 text-zinc-600">
        {corridaBambu.title} · {corridaBambu.dateLabel}, {corridaBambu.hora}. Só aparece quem já pagou. Entregou? Aperta{" "}
        <b>Entregue</b>. A lista atualiza sozinha. Link vale até {dia}/{mes}/{ano}.
      </p>

      {msg === "entregue" ? (
        <p className="mt-4 flex items-center gap-2 rounded-2xl bg-green-100 p-4 font-semibold text-green-900">
          <CheckCircle2 className="h-5 w-5" /> Baixa feita.
        </p>
      ) : null}
      {msg === "erro" ? (
        <p className="mt-4 rounded-2xl bg-red-100 p-4 font-semibold text-red-800">
          Não deu para dar baixa (já estava entregue?). Atualiza a página; se continuar, chama o Gabriel.
        </p>
      ) : null}

      <section className="mt-6 grid grid-cols-3 gap-2 text-center">
        <Numero rotulo="Vendidas" valor={total(r.vendidas)} />
        <Numero rotulo="Já pegaram" valor={total(r.entregues)} />
        <Numero rotulo="Falta entregar" valor={total(r.faltam)} destaque />
      </section>

      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200">
        <table className="w-full text-center text-sm">
          <thead className="bg-zinc-100 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="p-2 text-left">Tamanho</th>
              <th className="p-2">Vendidas</th>
              <th className="p-2">Falta entregar</th>
              <th className="p-2">Sobra no estoque</th>
            </tr>
          </thead>
          <tbody>
            {tamanhos.map((t) => (
              <tr key={t} className="border-t border-zinc-100">
                <td className="p-2 text-left font-bold">{t}</td>
                <td className="p-2">{r.vendidas[t] ?? 0}</td>
                <td className="p-2 font-bold">{r.faltam[t] ?? 0}</td>
                <td className="p-2">{estoque[t] ?? 0}</td>
              </tr>
            ))}
            <tr className="border-t border-zinc-200 bg-zinc-50 font-bold">
              <td className="p-2 text-left">Total</td>
              <td className="p-2">{total(r.vendidas)}</td>
              <td className="p-2">{total(r.faltam)}</td>
              <td className="p-2">{total(estoque)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-zinc-500">Sobra no estoque = o que ainda dá para vender na loja do site.</p>

      <form className="mt-6 flex gap-2" action={`/camisetas-treinao/${token}`}>
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar pelo nome"
          className="h-12 flex-1 rounded-full border border-zinc-300 px-4"
        />
        <button className="h-12 rounded-full bg-black px-5 text-sm font-bold uppercase text-white">Buscar</button>
      </form>

      <h2 className="mt-8 font-heading text-2xl font-black uppercase">Para entregar · {paraEntregar.length}</h2>
      {paraEntregar.length === 0 ? <p className="mt-3 text-zinc-500">Ninguém esperando.</p> : null}
      <ul className="mt-3 grid gap-3">
        {paraEntregar.map((v) => {
          const wa = linkWhatsapp(
            v.whatsapp,
            `Oii ${primeiroNome(v.nome)}! Sua camiseta do Treinão do Bambu (${descrever(v.itens)}) tá aqui comigo. Me procura pra retirar 🌴🙌`,
          );
          return (
            <li key={v.chave} className="rounded-3xl border border-zinc-200 bg-white p-4">
              <Cartao v={v} legenda={`pago ${quando(v.pagoEm)}`} />
              <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                <BotaoAcao
                  acao={entregarTreinao.bind(null, token, v.chave)}
                  confirmar={`Entregar ${descrever(v.itens)} para ${v.nome}?`}
                  className="bg-caicara-yellow text-black"
                >
                  Entregue
                </BotaoAcao>
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-zinc-300 px-5 text-sm font-bold uppercase"
                  >
                    <MessageCircle className="h-5 w-5" /> Chamar
                  </a>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {semPeca.length > 0 ? (
        <>
          <h2 className="mt-8 font-heading text-2xl font-black uppercase text-red-700">Pago sem peça · {semPeca.length}</h2>
          <p className="mt-1 text-sm text-zinc-600">Pagou, mas o tamanho acabou. Não entrega: chama o Gabriel.</p>
          <ul className="mt-3 grid gap-3">
            {semPeca.map((v) => (
              <li key={v.chave} className="rounded-3xl border-2 border-red-500 bg-red-50 p-4">
                <Cartao v={v} legenda={`pago ${quando(v.pagoEm)}`} />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h2 className="mt-8 font-heading text-2xl font-black uppercase text-zinc-500">Já pegaram · {entregues.length}</h2>
      <ul className="mt-3 grid gap-2">
        {entregues.map((v) => (
          <li key={v.chave} className="rounded-2xl bg-zinc-100 p-3 text-zinc-600">
            <Cartao v={v} legenda={`entregue ${quando(v.entregueEm)}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Numero({ rotulo, valor, destaque }: { rotulo: string; valor: number; destaque?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${destaque ? "bg-caicara-yellow text-black" : "bg-zinc-100"}`}>
      <p className="font-heading text-3xl font-black">{valor}</p>
      <p className="text-xs font-bold uppercase tracking-wider">{rotulo}</p>
    </div>
  );
}

function Cartao({ v, legenda }: { v: VendaTreinao; legenda: string }) {
  return (
    <>
      <p className="text-lg font-bold leading-tight">{v.nome}</p>
      <p className="mt-1 text-xl font-black">{descrever(v.itens)}</p>
      {v.outrosItens ? (
        <p className="mt-1 text-sm font-semibold text-amber-700">Esse pedido tem outro produto da loja: entrega só a camiseta e avisa o Gabriel.</p>
      ) : null}
      <p className="mt-1 text-sm text-zinc-500">{legenda}</p>
    </>
  );
}
