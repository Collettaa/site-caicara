import type { Metadata } from "next";
import { Undo2 } from "lucide-react";
import { exigirAdmin } from "@/lib/admin-auth";
import { type SituacaoParcelado, hojeSP, lerCaixa, porPessoa, situacaoParcelado } from "@/lib/caixa";
import { BotaoAcao } from "../BotaoAcao";
import { Recado, Secao, botaoPreto, brl, campo, dataCurta } from "../ui";
import { apagarParceladoAction, desfazerParcelaAction, pagarParcelaAction, salvarParceladoAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Parcelados" };

export default async function ParceladosPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string; pago?: string }> }) {
  await exigirAdmin();
  const sp = await searchParams;
  const hoje = hojeSP();
  const { parcelados } = await lerCaixa();
  const todos = parcelados.map((p) => situacaoParcelado(p, hoje));
  const pessoas = porPessoa(todos);
  const nomes = [...new Set(parcelados.map((p) => p.pessoa))];

  return (
    <div className="container max-w-2xl py-6 pb-16">
      <h1 className="font-heading text-4xl font-black uppercase tracking-tight">Parcelados</h1>
      <p className="mt-1 text-zinc-600">Compras e dívidas pagas em parcelas. Cada baixa conta uma parcela; a próxima vence sempre no dia combinado.</p>

      {sp.erro ? <Recado tipo="erro">{sp.erro === "parcela" ? "Falta o valor ou a data." : "Preencha pessoa, o quê, total, parcelas, dia e mês da 1ª."}</Recado> : null}
      {sp.ok ? <Recado tipo="ok">Salvo.</Recado> : null}

      {pessoas.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-white p-6 text-center text-lg text-zinc-600 ring-1 ring-zinc-200">
          Nada parcelado ainda. Cadastre abaixo, por exemplo: André · caixa de som · R$ 400 em 12× todo dia 10.
        </p>
      ) : null}

      {pessoas.map((g) => {
        const abertos = g.itens.filter((s) => !s.quitado);
        const quitados = g.itens.filter((s) => s.quitado);
        const pct = g.total ? Math.round((g.pago / g.total) * 100) : 0;
        return (
          <section key={g.pessoa} className="mt-6 rounded-3xl bg-black p-4 text-white sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-heading text-3xl font-black uppercase leading-none">{g.pessoa}</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  pagou {brl(g.pago)} de {brl(g.total)} · {pct}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-caicara-yellow">falta</p>
                <p className="font-heading text-3xl font-black tabular-nums">{brl(g.falta)}</p>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-zinc-800" aria-hidden>
              <div className="h-2 rounded-full bg-caicara-yellow" style={{ width: `${pct}%` }} />
            </div>
            <ul className="mt-4 grid gap-2">
              {abertos.map((s) => (
                <Item key={s.p.id} s={s} hoje={hoje} recem={sp.pago === s.p.id} />
              ))}
            </ul>
            {quitados.length ? (
              <details className="mt-3">
                <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-zinc-400">Quitados ({quitados.length})</summary>
                <ul className="grid gap-2">
                  {quitados.map((s) => (
                    <Item key={s.p.id} s={s} hoje={hoje} recem={false} />
                  ))}
                </ul>
              </details>
            ) : null}
          </section>
        );
      })}

      <Secao titulo="Novo parcelado">
        <FormParcelado nomes={nomes} hoje={hoje} />
      </Secao>
    </div>
  );
}

function Item({ s, hoje, recem }: { s: SituacaoParcelado; hoje: string; recem: boolean }) {
  const { p, proxima } = s;
  return (
    <li id={`p-${p.id}`} className="scroll-mt-24 rounded-3xl bg-white p-3 text-black">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-lg font-bold leading-snug">{p.descricao}</p>
          <p className="text-sm text-zinc-500">
            {brl(p.total)} em {p.parcelas}× de {brl(s.valorParcela)} · dia {p.dia}
            {p.obs ? ` · ${p.obs}` : ""}
          </p>
        </div>
        <p className="shrink-0 text-right font-heading text-lg font-black tabular-nums">
          {s.pagas}/{p.parcelas}
        </p>
      </div>

      {/* Uma casinha por parcela: cheia = paga, contorno vermelho = atrasada. */}
      <ol className="mt-3 flex flex-wrap gap-1" aria-label={`${s.pagas} de ${p.parcelas} parcelas pagas`}>
        {Array.from({ length: p.parcelas }, (_, i) => {
          const paga = i < s.pagas;
          const atrasada = !paga && proxima && i + 1 === proxima.n && proxima.atrasada;
          return (
            <li
              key={i}
              title={paga ? `${i + 1}ª paga em ${dataCurta(p.pagas[i].data)}` : `${i + 1}ª`}
              className={`grid h-8 place-items-center rounded-md text-xs font-bold ${
                paga ? "bg-caicara-yellow text-black" : atrasada ? "bg-red-50 text-red-600 ring-2 ring-red-500" : "bg-zinc-100 text-zinc-400"
              } ${p.parcelas > 24 ? "w-4 text-[0px]" : "w-8"}`}
            >
              {i + 1}
            </li>
          );
        })}
      </ol>

      <p className="mt-2 text-sm">
        Pago <strong>{brl(s.pago)}</strong> · falta <strong>{brl(s.falta)}</strong>
      </p>

      {proxima ? (
        <details className="mt-2 [&[open]>summary]:hidden" open={false}>
          <summary className={`${botaoPreto} w-full cursor-pointer list-none [&::-webkit-details-marker]:hidden ${proxima.atrasada ? "bg-red-600" : ""}`}>
            Pagou a {proxima.n}ª · {proxima.atrasada ? `venceu ${dataCurta(proxima.vence)}` : `vence ${dataCurta(proxima.vence)}`}
          </summary>
          <form action={pagarParcelaAction.bind(null, p.id)} className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <input name="valor" inputMode="decimal" required defaultValue={String(proxima.valor).replace(".", ",")} aria-label="Valor pago" className={`${campo} font-heading text-xl`} />
              <input name="data" type="date" required defaultValue={hoje} max={hoje} aria-label="Data que pagou" className={campo} />
            </div>
            <button className={`${botaoPreto} bg-green-700`}>Confirmar {proxima.n}ª parcela</button>
          </form>
        </details>
      ) : (
        <p className="mt-2 rounded-2xl bg-green-100 p-3 font-semibold text-green-800">Quitado.</p>
      )}

      {recem && s.pagas ? (
        <div className="mt-2">
          <BotaoAcao acao={desfazerParcelaAction.bind(null, p.id)} className="bg-caicara-yellow text-black">
            <Undo2 className="h-5 w-5" /> Desfazer a {s.pagas}ª
          </BotaoAcao>
        </div>
      ) : null}

      <details className="mt-1">
        <summary className="flex min-h-11 cursor-pointer items-center justify-end text-sm font-semibold text-zinc-500">Histórico e editar</summary>
        {p.pagas.length ? (
          <ul className="mb-3 grid gap-1 text-sm">
            {p.pagas.map((x) => (
              <li key={x.n} className="flex justify-between border-b border-zinc-100 py-1">
                <span>
                  {x.n}ª · paga {dataCurta(x.data)}/{x.data.slice(2, 4)}
                </span>
                <span className="font-semibold tabular-nums">{brl(x.valor)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {p.pagas.length && !recem ? (
          <div className="mb-3">
            <BotaoAcao acao={desfazerParcelaAction.bind(null, p.id)} confirmar={`Desfazer a ${p.pagas.length}ª parcela?`} className="bg-white text-zinc-700 ring-1 ring-zinc-300">
              <Undo2 className="h-5 w-5" /> Desfazer a última
            </BotaoAcao>
          </div>
        ) : null}
        <FormParcelado s={s} nomes={[]} hoje={hoje} />
        <div className="mt-2">
          <BotaoAcao acao={apagarParceladoAction.bind(null, p.id)} confirmar={`Apagar "${p.descricao}" e o histórico de parcelas?`} className="border border-red-300 bg-white text-red-600">
            Apagar
          </BotaoAcao>
        </div>
      </details>
    </li>
  );
}

function FormParcelado({ s, nomes, hoje }: { s?: SituacaoParcelado; nomes: string[]; hoje: string }) {
  const p = s?.p;
  return (
    <form action={salvarParceladoAction.bind(null, p?.id ?? null)} className="grid gap-2">
      <input name="pessoa" required minLength={2} list="pessoas" defaultValue={p?.pessoa ?? (nomes.length ? "" : "André")} placeholder="Quem paga" aria-label="Quem paga" className={campo} />
      <datalist id="pessoas">
        {nomes.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <input name="descricao" required minLength={2} maxLength={120} defaultValue={p?.descricao} placeholder="O quê? Ex.: caixa de som" aria-label="O quê" className={campo} />
      <div className="grid grid-cols-2 gap-2">
        <input name="total" inputMode="decimal" required defaultValue={p ? String(p.total).replace(".", ",") : ""} placeholder="Total R$" aria-label="Valor total" className={`${campo} font-heading text-xl`} />
        <label className="relative">
          <input name="parcelas" type="number" min={1} max={60} required defaultValue={p?.parcelas ?? 12} aria-label="Parcelas" className={`${campo} pr-12`} />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">vezes</span>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">dia</span>
          <input name="dia" type="number" min={1} max={31} required defaultValue={p?.dia ?? 10} aria-label="Dia de vencimento" className={`${campo} pl-12`} />
        </label>
        <input name="inicio" type="month" required defaultValue={p?.inicio ?? hoje.slice(0, 7)} aria-label="Mês da 1ª parcela" className={campo} />
      </div>
      <input name="obs" maxLength={200} defaultValue={p?.obs} placeholder="Observação (opcional)" aria-label="Observação" className={campo} />
      <button className={botaoPreto}>{p ? "Salvar" : "Adicionar"}</button>
      {!p ? <p className="text-xs text-zinc-500">Mês da 1ª parcela: se a primeira vence em dezembro, escolha dezembro.</p> : null}
    </form>
  );
}
