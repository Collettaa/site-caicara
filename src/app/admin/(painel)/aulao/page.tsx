import type { Metadata } from "next";
import { CheckCircle2, MessageCircle, Search } from "lucide-react";
import { exigirAdmin } from "@/lib/admin-auth";
import {
  aulaoRosa,
  formatWhatsapp,
  isPixPaid,
  listInscricoes,
  vinculoOptions,
  type Inscricao,
  type Vinculo,
} from "@/lib/aulao-rosa";
import { BotaoAcao } from "../BotaoAcao";
import { adicionarAction, marcarPagoPorForaAction, marcarPresenteAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Aulão Rosa" };

type Pagamento = "pix" | "fora" | "pendente" | "sem_pix" | "nao_paga";

const NOME_VINCULO: Record<Vinculo, string> = { aluno: "Aluno Caiçara", totalpass: "TotalPass", avulsa: "Avulsa" };

const ETIQUETA: Record<Pagamento, { texto: string; cor: string }> = {
  pix: { texto: "Pix pago", cor: "bg-green-100 text-green-800" },
  fora: { texto: "Pago por fora", cor: "bg-green-100 text-green-800" },
  pendente: { texto: "Pix pendente", cor: "bg-amber-100 text-amber-800" },
  sem_pix: { texto: "Não pagou", cor: "bg-red-100 text-red-700" },
  nao_paga: { texto: "", cor: "" },
};

const semAcento = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

async function pagamentoDe(i: Inscricao): Promise<Pagamento> {
  if (i.vinculo !== "avulsa") return "nao_paga";
  if (i.pagoPorFora) return "fora";
  if (!i.pagamentoId) return "sem_pix";
  // Status vem do Asaas na hora; se o Asaas falhar, mostra pendente (não some ninguém).
  return (await isPixPaid(i.pagamentoId).catch(() => false)) ? "pix" : "pendente";
}

export default async function AulaoAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; erro?: string }>;
}) {
  await exigirAdmin();
  const sp = await searchParams;
  const q = semAcento((sp.q ?? "").trim());

  const todos = await listInscricoes();
  const pagamentos = await Promise.all(todos.map(pagamentoDe));
  const linhas = todos.map((i, n) => ({ ...i, pagamento: pagamentos[n] })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const mostrar = q
    ? linhas.filter((i) => semAcento(i.nome).includes(q) || i.whatsapp.includes(q.replace(/\D/g, "") || "#"))
    : linhas;

  const contar = (v: Vinculo) => todos.filter((i) => i.vinculo === v).length;
  const presentes = todos.filter((i) => i.presente).length;
  const pagas = pagamentos.filter((p) => p === "pix" || p === "fora").length;
  const faltaPagar = pagamentos.filter((p) => p === "pendente" || p === "sem_pix").length;

  return (
    <div className="container py-6">
      <h1 className="font-heading text-4xl font-black uppercase tracking-tight">{aulaoRosa.title}</h1>
      <p className="mt-1 text-zinc-600">{aulaoRosa.dateLabel}</p>

      {sp.ok ? <p className="mt-4 rounded-2xl bg-green-100 p-4 font-semibold text-green-800">Inscrição adicionada.</p> : null}
      {sp.erro ? <p className="mt-4 rounded-2xl bg-red-100 p-4 font-semibold text-red-700">Confere nome e WhatsApp.</p> : null}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero rotulo="Inscritos" valor={todos.length} destaque />
        <Numero rotulo="Presentes" valor={presentes} />
        <Numero rotulo="Avulsas pagas" valor={pagas} sub={`R$ ${pagas * aulaoRosa.avulsaValor}`} />
        <Numero rotulo="Falta pagar" valor={faltaPagar} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
        {(Object.keys(vinculoOptions) as Vinculo[]).map((v) => (
          <span key={v} className="rounded-full bg-white px-3 py-1 ring-1 ring-zinc-200">
            {NOME_VINCULO[v]}: {contar(v)}
          </span>
        ))}
      </div>

      <form className="mt-6 flex gap-2" action="/admin/aulao">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Buscar nome ou WhatsApp"
            className="h-14 w-full rounded-full border border-zinc-300 bg-white pl-12 pr-4 text-lg outline-none focus:border-black"
          />
        </label>
        <button className="h-14 rounded-full bg-black px-6 text-sm font-bold uppercase text-white">Buscar</button>
      </form>

      <ul className="mt-4 grid gap-3">
        {mostrar.map((i) => (
          <li key={i.whatsapp} className="rounded-3xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-lg font-bold">
                  {i.presente ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : null}
                  {i.nome}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                  {NOME_VINCULO[i.vinculo]}
                  {ETIQUETA[i.pagamento].texto ? (
                    <span className={`rounded-full px-2 py-0.5 font-bold ${ETIQUETA[i.pagamento].cor}`}>
                      {ETIQUETA[i.pagamento].texto}
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
              {i.pagamento === "pendente" || i.pagamento === "sem_pix" || i.pagamento === "fora" ? (
                <BotaoAcao
                  acao={marcarPagoPorForaAction.bind(null, i.whatsapp, i.pagamento !== "fora")}
                  className={i.pagamento === "fora" ? "border border-zinc-300 bg-white text-zinc-700" : "bg-black text-white"}
                  confirmar={i.pagamento === "fora" ? undefined : `Recebeu R$ ${aulaoRosa.avulsaValor} de ${i.nome} por fora?`}
                >
                  {i.pagamento === "fora" ? "Desfazer pago" : `Recebi R$ ${aulaoRosa.avulsaValor} por fora`}
                </BotaoAcao>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {mostrar.length === 0 ? <p className="mt-6 text-zinc-500">Ninguém encontrado.</p> : null}

      <details className="mt-8 rounded-3xl border border-zinc-200 bg-white p-5">
        <summary className="cursor-pointer text-lg font-bold">+ Adicionar quem chegou sem inscrição</summary>
        <form action={adicionarAction} className="mt-4 grid gap-3">
          <input name="nome" required placeholder="Nome" className="h-14 rounded-2xl border border-zinc-300 px-4 text-lg" />
          <input name="whatsapp" required inputMode="tel" placeholder="WhatsApp com DDD" className="h-14 rounded-2xl border border-zinc-300 px-4 text-lg" />
          <select name="vinculo" required defaultValue="" className="h-14 rounded-2xl border border-zinc-300 bg-white px-4 text-lg">
            <option value="" disabled>Como veio?</option>
            {(Object.keys(vinculoOptions) as Vinculo[]).map((v) => (
              <option key={v} value={v}>{NOME_VINCULO[v]}</option>
            ))}
          </select>
          <label className="flex items-center gap-3 text-lg">
            <input type="checkbox" name="presente" defaultChecked className="h-6 w-6" /> Já está aqui (check-in)
          </label>
          <label className="flex items-center gap-3 text-lg">
            <input type="checkbox" name="pago" className="h-6 w-6" /> Avulsa: já pagou
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
