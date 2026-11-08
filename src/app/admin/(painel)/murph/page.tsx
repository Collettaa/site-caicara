import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MessageCircle, Search, Shirt } from "lucide-react";
import { exigirAdmin } from "@/lib/admin-auth";
import {
  bateriaLabel,
  baterias,
  contarTamanhos,
  devePagar,
  formatWhatsapp,
  listInscricoes,
  murph,
  ocupacao,
  tamanhos,
  versaoOptions,
  vinculoOptions,
  type Bateria,
  type Versao,
  type Vinculo,
} from "@/lib/murph";
import { BotaoAcao } from "../BotaoAcao";
import { adicionarAction, marcarPagoAction, marcarPresenteAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Murph" };

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default async function MurphAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; b?: string; ok?: string; erro?: string }>;
}) {
  await exigirAdmin();
  const sp = await searchParams;
  const q = semAcento((sp.q ?? "").trim());
  const filtro = baterias.includes(sp.b as Bateria) ? (sp.b as Bateria) : null;

  const todos = await listInscricoes();
  const porBateria = ocupacao(todos);
  const presentesPor = ocupacao(todos.filter((i) => i.presente));

  const linhas = [...todos].sort(
    (a, b) => baterias.indexOf(a.bateria) - baterias.indexOf(b.bateria) || a.nome.localeCompare(b.nome, "pt-BR"),
  );
  const mostrar = linhas.filter(
    (i) =>
      (!filtro || i.bateria === filtro) &&
      (!q || semAcento(i.nome).includes(q) || i.whatsapp.includes(q.replace(/\D/g, "") || "#")),
  );

  const camisetas = todos.filter((i) => i.camiseta).length;
  const { porTamanho, semTamanho } = contarTamanhos(todos);
  const aReceber = todos.filter((i) => devePagar(i) && !i.pago).length;
  const contar = <K extends string>(campo: (i: (typeof todos)[number]) => K, v: K) => todos.filter((i) => campo(i) === v).length;

  return (
    <div className="container py-6">
      <h1 className="font-heading text-4xl font-black uppercase tracking-tight">{murph.title}</h1>
      <p className="mt-1 text-zinc-600">{murph.dateLabel} · página: caicara.store/murph</p>

      {sp.ok ? <p className="mt-4 rounded-2xl bg-green-100 p-4 font-semibold text-green-800">Inscrição adicionada.</p> : null}
      {sp.erro ? <p className="mt-4 rounded-2xl bg-red-100 p-4 font-semibold text-red-700">Confere nome, WhatsApp, bateria e versão.</p> : null}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero rotulo="Inscritos" valor={todos.length} sub={`de ${baterias.length * murph.vagasPorBateria}`} destaque />
        <Numero rotulo="Presentes" valor={todos.filter((i) => i.presente).length} />
        <Numero rotulo="Camisetas" valor={camisetas} />
        <Numero rotulo="Falta acertar" valor={aReceber} sub="de fora ou camiseta" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {baterias.map((b) => {
          const cheia = porBateria[b] >= murph.vagasPorBateria;
          const ativo = filtro === b;
          return (
            <Link
              key={b}
              href={ativo ? "/admin/murph" : `/admin/murph?b=${encodeURIComponent(b)}`}
              className={`rounded-2xl p-3 text-center ring-1 ${ativo ? "bg-caicara-yellow text-black ring-caicara-yellow" : "bg-white ring-zinc-200"}`}
            >
              <p className="font-heading text-xl font-black">{bateriaLabel(b)}</p>
              <p className={`text-sm font-bold ${cheia ? "text-red-600" : "text-zinc-600"}`}>
                {porBateria[b]}/{murph.vagasPorBateria}
              </p>
              <p className="text-xs text-zinc-500">{presentesPor[b]} presentes</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
        {(Object.keys(vinculoOptions) as Vinculo[]).map((v) => (
          <span key={v} className="rounded-full bg-white px-3 py-1 ring-1 ring-zinc-200">
            {vinculoOptions[v]}: {contar((i) => i.vinculo, v)}
          </span>
        ))}
        {(Object.keys(versaoOptions) as Versao[]).map((v) => (
          <span key={v} className="rounded-full bg-zinc-100 px-3 py-1">
            {versaoOptions[v]}: {contar((i) => i.versao, v)}
          </span>
        ))}
      </div>

      <div className="mt-3 rounded-3xl bg-white p-4 ring-1 ring-zinc-200">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Camisetas por tamanho (pedido até 24/11)</p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm font-semibold">
          {tamanhos.map((t) => (
            <span key={t} className="rounded-full bg-black px-3 py-1 text-caicara-yellow">
              {t}: {porTamanho[t]}
            </span>
          ))}
          {semTamanho > 0 ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">sem tamanho: {semTamanho}</span>
          ) : null}
        </div>
      </div>

      <form className="mt-6 flex gap-2" action="/admin/murph">
        {filtro ? <input type="hidden" name="b" value={filtro} /> : null}
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder={filtro ? `Buscar na bateria das ${bateriaLabel(filtro)}` : "Buscar nome ou WhatsApp"}
            className="h-14 w-full rounded-full border border-zinc-300 bg-white pl-12 pr-4 text-lg outline-none focus:border-black"
          />
        </label>
        <button className="h-14 rounded-full bg-black px-6 text-sm font-bold uppercase text-white">Buscar</button>
      </form>

      <ul className="mt-4 grid gap-3">
        {mostrar.map((i) => {
          const deve = devePagar(i);
          return (
            <li key={i.whatsapp} className="rounded-3xl border border-zinc-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-lg font-bold">
                    {i.presente ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : null}
                    {i.nome}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                    <span className="rounded-full bg-black px-2 py-0.5 font-bold text-caicara-yellow">{bateriaLabel(i.bateria)}</span>
                    {vinculoOptions[i.vinculo]} · {versaoOptions[i.versao]}
                    {i.camiseta ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-zinc-800">
                        <Shirt className="h-4 w-4" /> camiseta {i.tamanho ?? "sem tamanho"}
                      </span>
                    ) : null}
                    {deve ? (
                      <span className={`rounded-full px-2 py-0.5 font-bold ${i.pago ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                        {i.pago ? "Acertado" : "Falta acertar"}
                      </span>
                    ) : null}
                  </p>
                </div>
                <a
                  href={`https://wa.me/${i.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-zinc-100 px-4 text-sm font-bold"
                  aria-label={`WhatsApp de ${i.nome}`}
                >
                  <MessageCircle className="h-4 w-4" />
                  {formatWhatsapp(i.whatsapp)}
                </a>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <BotaoAcao
                  acao={marcarPresenteAction.bind(null, i.whatsapp, !i.presente)}
                  className={i.presente ? "border border-zinc-300 bg-white text-zinc-700" : "bg-caicara-yellow text-black"}
                >
                  {i.presente ? "Desfazer check-in" : "Check-in"}
                </BotaoAcao>
                {deve ? (
                  <BotaoAcao
                    acao={marcarPagoAction.bind(null, i.whatsapp, !i.pago)}
                    className={i.pago ? "border border-zinc-300 bg-white text-zinc-700" : "bg-black text-white"}
                    confirmar={i.pago ? undefined : `${i.nome} acertou ${i.camiseta ? "a camiseta" : "a inscrição"}?`}
                  >
                    {i.pago ? "Desfazer acertado" : "Acertou"}
                  </BotaoAcao>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {mostrar.length === 0 ? <p className="mt-6 text-zinc-500">Ninguém encontrado.</p> : null}

      <details className="mt-8 rounded-3xl border border-zinc-200 bg-white p-5">
        <summary className="cursor-pointer text-lg font-bold">+ Adicionar inscrição no balcão</summary>
        <form action={adicionarAction} className="mt-4 grid gap-3">
          <input name="nome" required placeholder="Nome" className="h-14 rounded-2xl border border-zinc-300 px-4 text-lg" />
          <input name="whatsapp" required inputMode="tel" placeholder="WhatsApp com DDD" className="h-14 rounded-2xl border border-zinc-300 px-4 text-lg" />
          <select name="vinculo" required defaultValue="" className="h-14 rounded-2xl border border-zinc-300 bg-white px-4 text-lg">
            <option value="" disabled>É aluno, TotalPass ou de fora?</option>
            {(Object.keys(vinculoOptions) as Vinculo[]).map((v) => (
              <option key={v} value={v}>{vinculoOptions[v]}</option>
            ))}
          </select>
          <select name="bateria" required defaultValue={filtro ?? ""} className="h-14 rounded-2xl border border-zinc-300 bg-white px-4 text-lg">
            <option value="" disabled>Bateria</option>
            {baterias.map((b) => (
              <option key={b} value={b}>
                {bateriaLabel(b)} ({porBateria[b]}/{murph.vagasPorBateria})
              </option>
            ))}
          </select>
          <select name="versao" required defaultValue="" className="h-14 rounded-2xl border border-zinc-300 bg-white px-4 text-lg">
            <option value="" disabled>Versão</option>
            {(Object.keys(versaoOptions) as Versao[]).map((v) => (
              <option key={v} value={v}>{versaoOptions[v]}</option>
            ))}
          </select>
          <select name="tamanho" defaultValue="" className="h-14 rounded-2xl border border-zinc-300 bg-white px-4 text-lg">
            <option value="">Sem camiseta</option>
            {tamanhos.map((t) => (
              <option key={t} value={t}>Camiseta {t}</option>
            ))}
          </select>
          <label className="flex items-center gap-3 text-lg">
            <input type="checkbox" name="pago" className="h-6 w-6" /> Já acertou
          </label>
          <label className="flex items-center gap-3 text-lg">
            <input type="checkbox" name="presente" className="h-6 w-6" /> Já está aqui (check-in)
          </label>
          <button className="h-14 rounded-full bg-black text-sm font-bold uppercase tracking-[0.12em] text-white">Adicionar</button>
        </form>
      </details>
    </div>
  );
}

function Numero({ rotulo, valor, sub, destaque }: { rotulo: string; valor: number; sub?: string; destaque?: boolean }) {
  return (
    <div className={`rounded-3xl p-4 ${destaque ? "bg-black text-white" : "bg-white ring-1 ring-zinc-200"}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.14em] ${destaque ? "text-caicara-yellow" : "text-zinc-500"}`}>{rotulo}</p>
      <p className="mt-1 font-heading text-4xl font-black">{valor}</p>
      {sub ? <p className="text-sm font-semibold text-zinc-500">{sub}</p> : null}
    </div>
  );
}
