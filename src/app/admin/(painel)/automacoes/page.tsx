import type { Metadata } from "next";
import { exigirAdmin } from "@/lib/admin-auth";
import { type Lembrete, agoraSP, estadoDe, listarLembretes } from "@/lib/lembretes";
import { BotaoAcao } from "../BotaoAcao";
import { Recado, Secao, botaoPreto, campo, dataCurta, diaSemana } from "../ui";
import { apagarLembreteAction, salvarLembreteAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Automações" };

// Rotinas que rodam na VPS. Descrição fixa: o site não enxerga o servidor por fora do container.
const ROTINAS = [
  { quando: "a cada 10 min", nome: "Mensagens do grupo de alunos", detalhe: "Manda no grupo Caiçara Fit, pelo seu número, as mensagens agendadas abaixo. Uma por vez; com mais de 3 h de atraso, pula." },
  { quando: "todo dia 7h", nome: "Aviso das pendências", detalhe: "Mensagem no seu WhatsApp com o que está atrasado, vence hoje ou nos próximos 3 dias. Sem nada, não manda." },
  { quando: "todo dia 19h", nome: "Follow-up do AgenteIA", detalhe: "Tira da lista de follow quem já respondeu ou fechou." },
  { quando: "todo dia 22h", nome: "Resumo do grupo Caixa Caiçara", detalhe: "Lê o que foi anotado no grupo e responde o resumo do dia. Agora o caixa também se lança na aba Caixa." },
];

const COR_ESTADO = {
  agendado: "bg-caicara-yellow text-black",
  enviado: "bg-green-100 text-green-800",
  pulado: "bg-zinc-200 text-zinc-600",
  erro: "bg-red-100 text-red-700",
} as const;
const NOME_ESTADO = { agendado: "agendada", enviado: "enviada", pulado: "pulada (atrasou)", erro: "deu erro, tenta de novo" } as const;

export default async function AutomacoesPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await exigirAdmin();
  const sp = await searchParams;
  const agora = agoraSP();
  const lembretes = await listarLembretes();
  const proximos = lembretes.filter((l) => estadoDe(l) === "agendado" || estadoDe(l) === "erro");
  const saiu = lembretes.filter((l) => !proximos.includes(l)).reverse();
  const [hoje, horaAgora] = agora.split(" ");

  return (
    <div className="container max-w-2xl py-6 pb-16">
      <h1 className="font-heading text-4xl font-black uppercase tracking-tight">Automações</h1>

      {sp.ok ? <Recado tipo="ok">Mensagem agendada.</Recado> : null}
      {sp.erro ? <Recado tipo="erro">Falta data, hora ou o texto.</Recado> : null}

      <ul className="mt-4 grid gap-2">
        {ROTINAS.map((r) => (
          <li key={r.nome} className="grid grid-cols-[6.5rem_1fr] gap-3 rounded-3xl bg-white p-4 ring-1 ring-zinc-200">
            <p className="font-heading text-lg font-black leading-tight">{r.quando}</p>
            <div>
              <p className="font-bold">{r.nome}</p>
              <p className="text-sm text-zinc-500">{r.detalhe}</p>
            </div>
          </li>
        ))}
      </ul>

      <Secao titulo={`Próximas no grupo (${proximos.length})`}>
        {proximos.length === 0 ? <p className="text-zinc-500">Nenhuma mensagem agendada. Agende abaixo.</p> : null}
        <ul className="grid gap-4">
          {proximos.map((l) => (
            <Mensagem key={l.id} l={l} />
          ))}
        </ul>
      </Secao>

      <Secao titulo="Agendar mensagem no grupo" id="nova">
        <FormLembrete hoje={hoje} hora={horaAgora < "19:00" ? "19:00" : "12:00"} />
      </Secao>

      {saiu.length ? (
        <Secao titulo={`Já saíram (${saiu.length})`}>
          <details>
            <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-zinc-500">Ver mensagens enviadas</summary>
            <ul className="mt-2 grid gap-4">
              {saiu.map((l) => (
                <Mensagem key={l.id} l={l} />
              ))}
            </ul>
          </details>
        </Secao>
      ) : null}
    </div>
  );
}

function Mensagem({ l }: { l: Lembrete }) {
  const [data, hora] = l.quando.split(" ");
  const estado = estadoDe(l);
  const editavel = estado === "agendado" || estado === "erro";
  return (
    <li id={`l-${l.id}`} className="scroll-mt-24">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-heading text-lg font-black">
          {dataCurta(data)} {diaSemana(data)} · {hora}
        </span>
        {l.assunto ? <span className="font-semibold text-zinc-500">{l.assunto}</span> : null}
        <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${COR_ESTADO[estado]}`}>{NOME_ESTADO[estado]}</span>
      </div>
      {/* Do jeito que chega no grupo. */}
      <div className="mt-2 rounded-2xl rounded-tl-sm bg-[#d9fdd3] p-3 text-[15px] leading-relaxed text-zinc-900 shadow-[0_1px_0_rgba(0,0,0,0.08)]">
        <p className="whitespace-pre-wrap break-words">{l.texto}</p>
      </div>
      {l.erro ? <p className="mt-1 text-xs text-red-600">{l.erro}</p> : null}
      {editavel ? (
        <details className="mt-1">
          <summary className="flex min-h-11 cursor-pointer items-center justify-end text-sm font-semibold text-zinc-500">Editar</summary>
          <FormLembrete l={l} hoje={data} hora={hora} />
          <div className="mt-2">
            <BotaoAcao acao={apagarLembreteAction.bind(null, l.id)} confirmar="Cancelar esta mensagem? Ela não vai sair." className="border border-red-300 bg-white text-red-600">
              Cancelar mensagem
            </BotaoAcao>
          </div>
        </details>
      ) : null}
    </li>
  );
}

function FormLembrete({ l, hoje, hora }: { l?: Lembrete; hoje: string; hora: string }) {
  return (
    <form action={salvarLembreteAction.bind(null, l?.id ?? null)} className="grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <input name="data" type="date" required defaultValue={hoje} aria-label="Dia" className={campo} />
        <input name="hora" type="time" required defaultValue={hora} aria-label="Hora" className={campo} />
      </div>
      <input name="assunto" maxLength={40} defaultValue={l?.assunto} placeholder="Assunto curto (opcional). Ex.: Murph" aria-label="Assunto" className={campo} />
      <textarea
        name="texto"
        required
        rows={6}
        maxLength={4000}
        defaultValue={l?.texto}
        placeholder="Texto do jeito que vai sair no grupo"
        aria-label="Texto"
        className="w-full rounded-2xl border border-zinc-300 bg-white p-4 text-lg outline-none focus:border-black"
      />
      <button className={botaoPreto}>{l ? "Salvar" : "Agendar"}</button>
      {!l ? <p className="text-xs text-zinc-500">Sai pelo seu número no grupo Caiçara Fit, nunca pelo número do box.</p> : null}
    </form>
  );
}
