import type { Metadata } from "next";
import Link from "next/link";
import { Download, RefreshCw, Trash2 } from "lucide-react";
import { exigirAdmin } from "@/lib/admin-auth";
import { FORMAS, NOME_FORMA, type DiaLivro, hojeSP } from "@/lib/caixa";
import { livroCompleto } from "@/lib/caixa-livro";
import { BotaoAcao } from "../BotaoAcao";
import { MesNav, Recado, Secao, botaoClaro, botaoPreto, brl, campo, dataCurta, diaSemana, mesDe } from "../ui";
import { apagarLancamentoAction, lancarAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Caixa" };

// Colunas do livro: no celular Dia · Entrou · Saiu · Saldo; do sm pra cima abre Asaas, Balcão, TotalPass e Acumulado.
const grade =
  "grid grid-cols-[3.4rem_1fr_1fr_1fr] items-center gap-x-2 sm:grid-cols-[4.5rem_repeat(3,1fr)_1fr_1fr_1fr_1fr]";
const num = "text-right font-heading tabular-nums";
const soSm = "hidden sm:block";

export default async function CaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; atualizar?: string; ok?: string; erro?: string; dia?: string }>;
}) {
  await exigirAdmin();
  const sp = await searchParams;
  const mes = mesDe(sp.mes, hojeSP());
  const { hoje, dias, soma, contas, asaasErro, saldoAsaas, totalpassImportado } = await livroCompleto(mes, { recarregar: Boolean(sp.atualizar) });
  const faltaCobrir = Math.max(0, contas.total - soma.entrou);
  const cobertura = contas.total ? Math.min(100, Math.round((soma.entrou / contas.total) * 100)) : null;

  return (
    <div className="container max-w-4xl py-6">
      <MesNav rota="/admin/caixa" mes={mes} titulo="Caixa" />

      {sp.ok ? <Recado tipo="ok">{sp.ok === "saida" ? "Saída lançada." : "Entrada lançada."}</Recado> : null}
      {sp.erro ? <Recado tipo="erro">Falta o valor ou a data.</Recado> : null}

      {/* Espelho do mês */}
      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
        <Placar rotulo="Entrou" valor={soma.entrou} sub={`Asaas ${brl(soma.asaas)} · balcão ${brl(soma.balcao)}`} />
        <Placar rotulo="Saiu" valor={soma.saiu} sub={soma.taxas ? `com ${brl(soma.taxas)} de taxa do Asaas` : "contas pagas e gastos"} />
        <Placar rotulo="Sobrou" valor={soma.resultado} destaque sub="entrou menos saiu" />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 sm:gap-3">
        <Link href={`/admin/contas?mes=${mes}`} className="block rounded-3xl bg-white p-4 ring-1 ring-zinc-200">
          <p className="text-sm font-semibold text-zinc-500">Contas do mês</p>
          {contas.total ? (
            <>
              <p className="mt-1 text-lg">
                <strong>{brl(contas.falta)}</strong> para pagar de {brl(contas.total)}
                {contas.atrasadas ? <span className="font-bold text-red-600"> · {contas.atrasadas} atrasada{contas.atrasadas > 1 ? "s" : ""}</span> : null}
              </p>
              <div className="mt-3 h-3 rounded-full bg-zinc-100" aria-hidden>
                <div className="h-3 rounded-full bg-caicara-yellow" style={{ width: `${cobertura}%` }} />
              </div>
              <p className="mt-2 text-sm text-zinc-600">
                {faltaCobrir > 0 ? (
                  <>
                    Para cobrir as contas do mês ainda precisa entrar <strong>{brl(faltaCobrir)}</strong>.
                  </>
                ) : (
                  "O que entrou já cobre as contas do mês."
                )}
              </p>
            </>
          ) : (
            <p className="mt-1 text-lg">Nenhuma conta cadastrada. Toque para pôr Maria, Grazy, aluguel…</p>
          )}
        </Link>
        <div className="rounded-3xl border-2 border-dashed border-[#6250d6]/40 bg-[#6250d6]/5 p-4">
          <p className="text-sm font-semibold text-[#4b3db0]">TotalPass · previsto</p>
          <p className="mt-1 text-lg">
            <strong>{brl(soma.totalpass)}</strong> de {soma.checkins} check-ins
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Não soma no caixa: vira dinheiro quando a TotalPass deposita.{" "}
            {!totalpassImportado ? (
              <Link href={`/admin/financeiro?mes=${mes}#totalpass`} className="font-semibold underline">
                Importar planilha
              </Link>
            ) : null}
          </p>
        </div>
      </div>
      {saldoAsaas !== null ? <p className="mt-3 text-sm text-zinc-500">Saldo na conta do Asaas agora: {brl(saldoAsaas)}.</p> : null}
      {asaasErro ? <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-200">{asaasErro}</p> : null}

      <Secao titulo="Lançar" id="lancar">
        <form action={lancarAction} className="grid gap-2">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Entrou ou saiu">
            <Opcao nome="tipo" valor="entrada" padrao>
              + Entrou
            </Opcao>
            <Opcao nome="tipo" valor="saida">
              − Saiu
            </Opcao>
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-2">
            <input name="valor" inputMode="decimal" required placeholder="R$ 0,00" aria-label="Valor" className={`${campo} font-heading text-xl`} />
            <input name="descricao" maxLength={200} placeholder="Do quê? Ex.: avulsa Ana, água" aria-label="Descrição" className={campo} />
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 max-sm:grid-cols-2">
            <select name="forma" aria-label="Forma" className={campo} defaultValue="dinheiro">
              {FORMAS.map((f) => (
                <option key={f} value={f}>
                  {NOME_FORMA[f]}
                </option>
              ))}
            </select>
            <input name="data" type="date" required defaultValue={hoje} max={hoje} aria-label="Data (pode ser dia que passou)" className={campo} />
            <button className={`${botaoPreto} max-sm:col-span-2`}>Lançar</button>
          </div>
          <p className="text-xs text-zinc-500">
            Só o que não passa pelo Asaas: dinheiro, maquininha, Pix que caiu direto no banco. Conta da equipe se paga na aba Contas.
          </p>
        </form>
      </Secao>

      <Secao
        titulo="Livro do mês"
        extra={
          <a href={`/admin/caixa.csv?mes=${mes}`} className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-bold ring-1 ring-zinc-300">
            <Download className="h-4 w-4" /> CSV
          </a>
        }
      >
        {dias.length === 0 ? (
          <p className="text-zinc-500">Mês ainda não começou.</p>
        ) : (
          <div className="-mx-4 sm:-mx-5">
            <div className={`${grade} border-b-2 border-black px-4 pb-2 text-xs font-bold text-zinc-500 sm:px-5`}>
              <span>Dia</span>
              <span className={`${soSm} text-right`}>Asaas</span>
              <span className={`${soSm} text-right`}>Balcão</span>
              <span className="text-right">Entrou</span>
              <span className="text-right">Saiu</span>
              <span className="text-right">Saldo</span>
              <span className={`${soSm} text-right`}>Acumulado</span>
              <span className={`${soSm} text-right text-[#4b3db0]`}>TotalPass*</span>
            </div>
            {[...dias].reverse().map((d) => (
              <LinhaDia key={d.dia} d={d} hoje={hoje} mes={mes} aberto={sp.dia === d.dia} />
            ))}
            <div className={`${grade} border-t-2 border-black px-4 pt-3 font-bold sm:px-5`}>
              <span>Mês</span>
              <span className={`${num} ${soSm}`}>{brl(soma.asaas)}</span>
              <span className={`${num} ${soSm}`}>{brl(soma.balcao)}</span>
              <span className={num}>{brl(soma.entrou)}</span>
              <span className={num}>{brl(soma.saiu)}</span>
              <span className={`${num} ${soma.resultado < 0 ? "text-red-600" : ""}`}>{brl(soma.resultado)}</span>
              <span className={soSm} />
              <span className={`${num} ${soSm} text-[#4b3db0]`}>{brl(soma.totalpass)}</span>
            </div>
            <p className="mt-3 px-4 text-xs text-zinc-500 sm:px-5">
              Toque no dia para ver quem pagou e o que saiu. *TotalPass é previsto: não entra no saldo.
            </p>
          </div>
        )}
      </Secao>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link href={`/admin/caixa?mes=${mes}&atualizar=1`} className={botaoClaro}>
          <RefreshCw className="h-4 w-4" /> Atualizar Asaas
        </Link>
        <Link href={`/admin/financeiro?mes=${mes}`} className={botaoClaro}>
          Gráficos do Asaas
        </Link>
      </div>
    </div>
  );
}

function LinhaDia({ d, hoje, mes, aberto }: { d: DiaLivro; hoje: string; mes: string; aberto: boolean }) {
  const vazio = !d.entrou && !d.saiu && !d.checkins;
  const ehHoje = d.dia === hoje;
  const fimDeSemana = ["sáb", "dom"].includes(diaSemana(d.dia));
  return (
    <details id={`d-${d.dia}`} open={aberto} className={`group scroll-mt-24 border-b border-zinc-100 ${ehHoje ? "bg-caicara-yellow/25" : ""}`}>
      <summary
        className={`${grade} min-h-12 cursor-pointer list-none px-4 py-2 sm:px-5 [&::-webkit-details-marker]:hidden ${vazio ? "text-zinc-300" : ""} ${ehHoje ? "bg-caicara-yellow/40" : "group-open:bg-zinc-50"}`}
      >
        <span className="leading-tight">
          <span className="font-heading text-lg font-black">{d.dia.slice(8)}</span>{" "}
          <span className={`text-xs ${fimDeSemana ? "text-zinc-400" : "text-zinc-500"}`}>{ehHoje ? "hoje" : diaSemana(d.dia)}</span>
        </span>
        <span className={`${num} ${soSm}`}>{d.asaas ? brl(d.asaas) : "–"}</span>
        <span className={`${num} ${soSm}`}>{d.balcao ? brl(d.balcao) : "–"}</span>
        <span className={`${num} ${vazio ? "" : "text-zinc-900"}`}>{d.entrou ? brl(d.entrou) : "–"}</span>
        <span className={num}>{d.saiu ? brl(d.saiu) : "–"}</span>
        <span className={`${num} font-bold ${d.movimento < 0 ? "text-red-600" : ""}`}>{d.movimento ? brl(d.movimento) : "–"}</span>
        <span className={`${num} ${soSm} text-zinc-500`}>{brl(d.acumulado)}</span>
        <span className={`${num} ${soSm} text-[#4b3db0]`}>{d.checkins ? `${d.checkins} · ${brl(d.totalpass)}` : "–"}</span>
      </summary>

      <div className="grid gap-1 bg-zinc-50 px-4 pb-4 sm:px-5">
        {vazio ? <p className="py-2 text-sm text-zinc-500">Nada neste dia.</p> : null}
        {d.itensAsaas.map((i, n) => (
          <Item key={`a${n}`} cor="bg-green-600" titulo={i.cliente} sub={[i.descricao || null, i.origem, `${i.forma}${i.parcelas > 1 ? ` ${i.parcelas}×` : ""}`, "Asaas"].filter(Boolean).join(" · ")} valor={i.valor} />
        ))}
        {d.lancamentos.map((l) => (
          <Item
            key={l.id}
            cor={l.tipo === "entrada" ? "bg-green-600" : "bg-red-500"}
            titulo={l.descricao}
            sub={`${l.contaId && l.forma === "pix" ? "Pix" : NOME_FORMA[l.forma]}${l.contaId ? " · conta do mês" : ""}${l.encomendaId ? " · encomenda" : ""}`}
            valor={l.tipo === "saida" ? -l.valor : l.valor}
            acao={
              <BotaoAcao acao={apagarLancamentoAction.bind(null, l.id, mes)} confirmar={`Apagar "${l.descricao}" (${brl(l.valor)})?`} className="!h-10 !w-10 !px-0 text-zinc-400">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Apagar {l.descricao}</span>
              </BotaoAcao>
            }
          />
        ))}
        {d.taxas ? <Item cor="bg-red-300" titulo="Taxas do Asaas" sub="cobrança, mensagem e antecipação" valor={-d.taxas} /> : null}
        {d.checkins ? (
          <Item cor="bg-[#6250d6]" titulo={`${d.checkins} check-in${d.checkins > 1 ? "s" : ""} TotalPass`} sub="previsto, não é caixa" valor={d.totalpass} previsto />
        ) : null}
        <Link href={`/admin/caixa?mes=${mes}&dia=${d.dia}#lancar`} className="mt-1 text-sm font-semibold text-zinc-600 underline">
          Lançar algo em {dataCurta(d.dia)}
        </Link>
      </div>
    </details>
  );
}

function Item({ cor, titulo, sub, valor, acao, previsto }: { cor: string; titulo: string; sub: string; valor: number; acao?: React.ReactNode; previsto?: boolean }) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-200/70 py-2 last:border-0">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cor}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{titulo}</p>
        <p className="truncate text-xs text-zinc-500">{sub}</p>
      </div>
      <span className={`shrink-0 font-heading tabular-nums ${previsto ? "text-[#4b3db0]" : valor < 0 ? "text-red-600" : ""}`}>{brl(valor)}</span>
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </div>
  );
}

function Placar({ rotulo, valor, sub, destaque }: { rotulo: string; valor: number; sub: string; destaque?: boolean }) {
  return (
    <div className={`rounded-3xl p-3 sm:p-4 ${destaque ? "bg-black text-white" : "bg-white ring-1 ring-zinc-200"}`}>
      <p className={`text-sm font-semibold ${destaque ? "text-caicara-yellow" : "text-zinc-500"}`}>{rotulo}</p>
      <p className={`mt-1 whitespace-nowrap font-heading text-[clamp(0.95rem,4.6vw,1.875rem)] font-black tabular-nums ${valor < 0 ? "text-red-500" : ""}`}>{brl(valor)}</p>
      <p className={`mt-1 hidden text-xs sm:block ${destaque ? "text-zinc-400" : "text-zinc-500"}`}>{sub}</p>
    </div>
  );
}

function Opcao({ nome, valor, padrao, children }: { nome: string; valor: string; padrao?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex h-14 cursor-pointer items-center justify-center rounded-2xl font-heading text-xl font-black uppercase ring-1 ring-zinc-300 has-[:checked]:bg-black has-[:checked]:text-white has-[:checked]:ring-black has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
      <input type="radio" name={nome} value={valor} defaultChecked={padrao} className="sr-only" />
      {children}
    </label>
  );
}
