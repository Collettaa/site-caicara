import type { Metadata } from "next";
import { Check, Undo2 } from "lucide-react";
import { exigirAdmin } from "@/lib/admin-auth";
import { type ContaDoMes, FORMAS, GRUPOS, NOME_FORMA, NOME_GRUPO, contasDoMes, hojeSP, lerCaixa, totaisContas } from "@/lib/caixa";
import { BotaoAcao } from "../BotaoAcao";
import { MesNav, Recado, Secao, botaoPreto, brl, campo, dataCurta, mesDe } from "../ui";
import { desfazerPagamentoAction, encerrarContaAction, pagarContaAction, salvarContaAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contas" };

const ERROS: Record<string, string> = {
  conta: "Preencha nome, valor e dia (1 a 31).",
  pagar: "Falta o valor ou a data do pagamento.",
};

export default async function ContasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; ok?: string; erro?: string; pago?: string }>;
}) {
  await exigirAdmin();
  const sp = await searchParams;
  const hoje = hojeSP();
  const mes = mesDe(sp.mes, hoje);
  const dados = await lerCaixa();
  const itens = contasDoMes(dados, mes, hoje);
  const t = totaisContas(itens);
  const recemPaga = sp.pago ? itens.find((i) => i.conta.id === sp.pago && i.pagamento) : undefined;
  const dataPadrao = hoje.startsWith(mes) ? hoje : mes < hoje ? `${mes}-${String(new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5, 7), 0)).getUTCDate())}` : `${mes}-01`;

  return (
    <div className="container max-w-2xl py-6 pb-28">
      <MesNav rota="/admin/contas" mes={mes} titulo="Contas" />

      {sp.erro ? <Recado tipo="erro">{ERROS[sp.erro] ?? "Confira os campos."}</Recado> : null}
      {sp.ok === "salva" ? <Recado tipo="ok">Conta salva.</Recado> : null}
      {sp.ok === "encerrada" ? <Recado tipo="ok">Conta encerrada: não aparece mais nos próximos meses.</Recado> : null}

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Bloco rotulo="Falta pagar" valor={t.falta} destaque={t.falta > 0} />
        <Bloco rotulo="Já paguei" valor={t.pago} />
        <Bloco rotulo="Total do mês" valor={t.total} />
      </div>
      {t.atrasadas ? (
        <p className="mt-3 rounded-2xl bg-red-600 p-3 font-semibold text-white">
          {t.atrasadas} conta{t.atrasadas > 1 ? "s" : ""} passou do dia.
        </p>
      ) : null}

      {itens.length === 0 ? (
        <p className="mt-8 rounded-3xl bg-white p-6 text-center text-lg text-zinc-600 ring-1 ring-zinc-200">
          Nenhuma conta neste mês. Cadastre abaixo quem você paga todo mês: Maria, Grazy, professor do sábado, aluguel.
        </p>
      ) : null}

      {GRUPOS.map((g) => {
        const doGrupo = itens.filter((i) => i.conta.grupo === g);
        if (!doGrupo.length) return null;
        const falta = doGrupo.filter((i) => !i.pagamento).reduce((s, i) => s + i.conta.valor, 0);
        return (
          <section key={g} className="mt-6">
            <h2 className="flex items-baseline justify-between text-sm font-bold text-zinc-500">
              <span>{NOME_GRUPO[g]}</span>
              <span>{falta ? `falta ${brl(falta)}` : "tudo pago"}</span>
            </h2>
            <ul className="mt-2 grid gap-2">
              {doGrupo.map((i) => (
                <LinhaConta key={i.conta.id} i={i} mes={mes} dataPadrao={dataPadrao} />
              ))}
            </ul>
          </section>
        );
      })}

      <Secao titulo="Nova conta">
        <FormConta mes={mes} />
      </Secao>

      {recemPaga ? (
        <div className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-3xl bg-black p-3 pl-5 text-white shadow-xl">
          <p className="min-w-0 flex-1 truncate font-semibold">
            Pago: {recemPaga.conta.nome} · {brl(recemPaga.pagamento!.valor)}
          </p>
          <div className="w-40 shrink-0">
            <BotaoAcao acao={desfazerPagamentoAction.bind(null, recemPaga.conta.id, mes)} className="bg-caicara-yellow text-black">
              <Undo2 className="h-5 w-5" /> Desfazer
            </BotaoAcao>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LinhaConta({ i, mes, dataPadrao }: { i: ContaDoMes; mes: string; dataPadrao: string }) {
  const { conta, situacao, pagamento, vence } = i;
  const borda = situacao === "atrasada" ? "border-red-300" : situacao === "hoje" ? "border-caicara-yellow border-2" : "border-zinc-200";
  return (
    <li className={`rounded-3xl border bg-white p-3 ${pagamento ? "bg-zinc-50" : ""} ${borda}`}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 pl-1">
          <p className={`break-words text-lg font-bold leading-snug ${pagamento ? "text-zinc-500" : ""}`}>{conta.nome}</p>
          <p className={`text-sm ${situacao === "atrasada" ? "font-bold text-red-600" : "text-zinc-500"}`}>
            {pagamento
              ? `pago ${dataCurta(pagamento.data)} · ${pagamento.forma === "pix" ? "Pix" : NOME_FORMA[pagamento.forma]}`
              : situacao === "atrasada"
                ? `venceu ${dataCurta(vence)}`
                : situacao === "hoje"
                  ? "vence hoje"
                  : `dia ${dataCurta(vence)}`}
            {conta.unica ? " · só este mês" : ""}
            {conta.obs ? ` · ${conta.obs}` : ""}
          </p>
        </div>
        <span className={`shrink-0 font-heading text-xl font-black tabular-nums ${pagamento ? "text-zinc-400" : ""}`}>
          {brl(pagamento?.valor ?? conta.valor)}
        </span>
        {pagamento ? (
          <div className="w-14 shrink-0">
            <BotaoAcao acao={desfazerPagamentoAction.bind(null, conta.id, mes)} confirmar={`Desfazer o pagamento de ${conta.nome}?`} className="!px-0 bg-green-600 text-white">
              <Check className="h-6 w-6" />
              <span className="sr-only">Desfazer pagamento de {conta.nome}</span>
            </BotaoAcao>
          </div>
        ) : null}
      </div>

      {!pagamento ? (
        <details className="mt-2 [&[open]>summary]:hidden">
          <summary className={`${botaoPreto} w-full cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>Paguei</summary>
          <form action={pagarContaAction.bind(null, conta.id, mes)} className="grid gap-2">
            <p className="text-sm text-zinc-500">Confere e confirma. Vira saída no caixa na data que pagou.</p>
            <div className="grid grid-cols-2 gap-2">
              <input name="valor" inputMode="decimal" required defaultValue={String(conta.valor).replace(".", ",")} aria-label="Valor pago" className={`${campo} font-heading text-xl`} />
              <input name="data" type="date" required defaultValue={dataPadrao} aria-label="Data do pagamento" className={campo} />
            </div>
            <select name="forma" defaultValue="pix" aria-label="Como pagou" className={campo}>
              {FORMAS.map((f) => (
                <option key={f} value={f}>
                  {f === "pix" ? "Pix" : NOME_FORMA[f]}
                </option>
              ))}
            </select>
            <button className={`${botaoPreto} bg-green-700`}>Confirmar pagamento</button>
          </form>
        </details>
      ) : null}

      <details className="mt-1">
        <summary className="flex min-h-11 cursor-pointer items-center justify-end text-sm font-semibold text-zinc-500">Editar</summary>
        <FormConta mes={mes} conta={i} />
        <div className="mt-2">
          <BotaoAcao
            acao={encerrarContaAction.bind(null, conta.id, mes)}
            confirmar={`Encerrar "${conta.nome}"? Some dos próximos meses; o que já foi pago continua no caixa.`}
            className="border border-red-300 bg-white text-red-600"
          >
            Encerrar conta
          </BotaoAcao>
        </div>
      </details>
    </li>
  );
}

function FormConta({ mes, conta }: { mes: string; conta?: ContaDoMes }) {
  const c = conta?.conta;
  return (
    <form action={salvarContaAction.bind(null, c?.id ?? null)} className="grid gap-2">
      <input type="hidden" name="mes" value={mes} />
      {c ? <input type="hidden" name="desde" value={c.desde} /> : null}
      <input name="nome" required minLength={2} maxLength={80} defaultValue={c?.nome} placeholder="Quem ou o quê? Ex.: Maria, aluguel" aria-label="Nome" className={campo} />
      <div className="grid grid-cols-2 gap-2">
        <input name="valor" inputMode="decimal" required defaultValue={c ? String(c.valor).replace(".", ",") : ""} placeholder="Valor R$" aria-label="Valor por mês" className={`${campo} font-heading text-xl`} />
        <label className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">dia</span>
          <input name="dia" type="number" min={1} max={31} required defaultValue={c?.dia ?? 5} aria-label="Dia que paga" className={`${campo} pl-12`} />
        </label>
      </div>
      <select name="grupo" defaultValue={c?.grupo ?? "equipe"} aria-label="Grupo" className={campo}>
        {GRUPOS.map((g) => (
          <option key={g} value={g}>
            {NOME_GRUPO[g]}
          </option>
        ))}
      </select>
      <input name="obs" maxLength={200} defaultValue={c?.obs} placeholder="Observação (opcional). Ex.: aulas de sábado" aria-label="Observação" className={campo} />
      <label className="flex min-h-12 items-center gap-3 text-base">
        <input type="checkbox" name="unica" value="1" defaultChecked={c?.unica} className="h-6 w-6 accent-black" />
        Só este mês (conta avulsa)
      </label>
      <button className={botaoPreto}>{c ? "Salvar" : "Adicionar conta"}</button>
      {!c ? <p className="text-xs text-zinc-500">Aparece todo mês a partir deste. Se um mês o valor mudar, ajusta na hora de pagar.</p> : null}
    </form>
  );
}

function Bloco({ rotulo, valor, destaque }: { rotulo: string; valor: number; destaque?: boolean }) {
  return (
    <div className={`rounded-3xl p-3 ${destaque ? "bg-caicara-yellow text-black" : "bg-white ring-1 ring-zinc-200"}`}>
      <p className="text-sm font-semibold">{rotulo}</p>
      <p className="mt-1 font-heading text-xl font-black tabular-nums sm:text-2xl">{brl(valor)}</p>
    </div>
  );
}
