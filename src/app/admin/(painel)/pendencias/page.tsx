import type { Metadata } from "next";
import { Check, Undo2 } from "lucide-react";
import { exigirAdmin } from "@/lib/admin-auth";
import { agrupar, hojeSP, listarPendencias, rotuloData, type Pendencia } from "@/lib/pendencias";
import { BotaoAcao } from "../BotaoAcao";
import { adicionarAction, apagarAction, editarAction, marcarAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pendências" };

const campo = "h-14 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-lg outline-none focus:border-black";

export default async function PendenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ feito?: string; erro?: string }>;
}) {
  await exigirAdmin();
  const sp = await searchParams;
  const itens = await listarPendencias();
  const hoje = hojeSP();
  const { atrasadas, paraHoje, proximas, semData, feitas } = agrupar(itens, hoje);
  const recemFeita = sp.feito ? feitas.find((p) => p.id === sp.feito) : undefined;
  const abertas = atrasadas.length + paraHoje.length + proximas.length + semData.length;

  return (
    <div className="container max-w-2xl py-6 pb-28">
      <h1 className="font-heading text-4xl font-black uppercase tracking-tight">Pendências</h1>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Contador rotulo="Atrasadas" valor={atrasadas.length} alerta={atrasadas.length > 0} />
        <Contador rotulo="Para hoje" valor={paraHoje.length} destaque={paraHoje.length > 0} />
      </div>

      {sp.erro ? <p className="mt-4 rounded-2xl bg-red-100 p-4 font-semibold text-red-700">Escreve o que precisa fazer.</p> : null}

      <form action={adicionarAction} className="mt-4 grid gap-2 rounded-3xl bg-white p-3 ring-1 ring-zinc-200">
        <input name="texto" required minLength={2} maxLength={300} placeholder="O que precisa fazer?" className={campo} />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input name="prazo" type="date" aria-label="Prazo (opcional)" className={campo} />
          <button className="h-14 rounded-full bg-black px-6 text-sm font-bold uppercase tracking-[0.12em] text-white">Adicionar</button>
        </div>
      </form>

      {abertas === 0 ? <p className="mt-8 text-center text-lg font-semibold text-zinc-500">Nada pendente.</p> : null}

      <Grupo titulo="Atrasadas" itens={atrasadas} cor="text-red-600" dataCor="text-red-600 font-bold" />
      <Grupo titulo="Hoje" itens={paraHoje} cor="text-black" />
      <Grupo titulo="Próximas" itens={proximas} cor="text-zinc-500" />
      <Grupo titulo="Sem data" itens={semData} cor="text-zinc-500" />

      {feitas.length ? (
        <details className="mt-8">
          <summary className="flex min-h-12 cursor-pointer items-center text-sm font-bold uppercase tracking-[0.14em] text-zinc-500">
            Feitas ({feitas.length})
          </summary>
          <ul className="mt-2 grid gap-2">
            {feitas.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-3xl bg-zinc-100 p-3">
                <div className="w-14 shrink-0">
                  <BotaoAcao acao={marcarAction.bind(null, p.id, false)} className="!px-0 bg-green-600 text-white">
                    <Check className="h-6 w-6" />
                    <span className="sr-only">Desfazer {p.texto}</span>
                  </BotaoAcao>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-zinc-500 line-through">{p.texto}</p>
                  <p className="text-sm text-zinc-500">feita em {rotuloData(p.feitaEm!)}</p>
                </div>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {recemFeita ? (
        <div className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-3xl bg-black p-3 pl-5 text-white shadow-xl">
          <p className="min-w-0 flex-1 truncate font-semibold">Feita: {recemFeita.texto}</p>
          <div className="w-40 shrink-0">
            <BotaoAcao acao={marcarAction.bind(null, recemFeita.id, false)} className="bg-caicara-yellow text-black">
              <Undo2 className="h-5 w-5" />
              Desfazer
            </BotaoAcao>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Contador({ rotulo, valor, alerta, destaque }: { rotulo: string; valor: number; alerta?: boolean; destaque?: boolean }) {
  const cor = alerta ? "bg-red-600 text-white" : destaque ? "bg-caicara-yellow text-black" : "bg-white text-black ring-1 ring-zinc-200";
  return (
    <div className={`rounded-3xl p-4 ${cor}`}>
      <p className="font-heading text-5xl font-black leading-none">{valor}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em]">{rotulo}</p>
    </div>
  );
}

function Grupo({ titulo, itens, cor, dataCor }: { titulo: string; itens: Pendencia[]; cor: string; dataCor?: string }) {
  if (!itens.length) return null;
  return (
    <section className="mt-6">
      <h2 className={`text-sm font-bold uppercase tracking-[0.14em] ${cor}`}>
        {titulo} ({itens.length})
      </h2>
      <ul className="mt-2 grid gap-2">
        {itens.map((p) => (
          <li key={p.id} className="rounded-3xl border border-zinc-200 bg-white p-3">
            <div className="flex items-center gap-3">
              <div className="w-14 shrink-0">
                <BotaoAcao acao={marcarAction.bind(null, p.id, true)} className="!px-0 border-2 border-zinc-300 bg-white text-zinc-300">
                  <Check className="h-6 w-6" />
                  <span className="sr-only">Marcar feita: {p.texto}</span>
                </BotaoAcao>
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words text-lg font-semibold leading-snug">{p.texto}</p>
                {p.prazo ? <p className={`text-sm ${dataCor ?? "text-zinc-500"}`}>{rotuloData(p.prazo)}</p> : null}
              </div>
            </div>
            <details className="mt-1">
              <summary className="flex min-h-11 cursor-pointer items-center justify-end text-sm font-semibold text-zinc-500">Editar</summary>
              <form action={editarAction.bind(null, p.id)} className="grid gap-2">
                <input name="texto" required minLength={2} maxLength={300} defaultValue={p.texto} aria-label="Texto" className={campo} />
                <input name="prazo" type="date" defaultValue={p.prazo ?? ""} aria-label="Prazo" className={campo} />
                <button className="h-14 rounded-full bg-black text-sm font-bold uppercase tracking-[0.12em] text-white">Salvar</button>
              </form>
              <div className="mt-2">
                <BotaoAcao
                  acao={apagarAction.bind(null, p.id)}
                  confirmar={`Apagar "${p.texto}"?`}
                  className="border border-red-300 bg-white text-red-600"
                >
                  Apagar
                </BotaoAcao>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
