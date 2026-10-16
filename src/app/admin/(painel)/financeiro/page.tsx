import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import { exigirAdmin } from "@/lib/admin-auth";
import { financeiroAtivo, financeiroDoMes, hojeSP, mesValido } from "@/lib/financeiro/asaas";
import { type Aberto, NOME_ORIGEM, ORDEM_ORIGEM, type Origem, acumulado } from "@/lib/financeiro/resumo";
import { Acumulado, BarrasPorDia, Legenda } from "./Graficos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Financeiro" };

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataCurta = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const NOME_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function vizinho(mes: string, passo: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + passo, 1));
  return d.toISOString().slice(0, 7);
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; origem?: string; dia?: string; atualizar?: string }>;
}) {
  await exigirAdmin();
  const sp = await searchParams;
  const mes = mesValido(sp.mes);
  const origem = ORDEM_ORIGEM.includes(sp.origem as Origem) ? (sp.origem as Origem) : null;
  const [ano, m] = mes.split("-");

  if (!financeiroAtivo()) {
    return <Aviso texto="Chave do Asaas não configurada no servidor." />;
  }
  let dados, anterior;
  try {
    [dados, anterior] = await Promise.all([
      financeiroDoMes(mes, { recarregar: Boolean(sp.atualizar) }),
      financeiroDoMes(vizinho(mes, -1), { recarregar: Boolean(sp.atualizar) }),
    ]);
  } catch (e) {
    console.error("[financeiro]", e instanceof Error ? e.message.slice(0, 300) : e);
    return <Aviso texto="O Asaas não respondeu agora. Toque em Atualizar daqui a pouco." mes={mes} />;
  }
  const { resumo: r, saldo } = dados;
  const aReceber = r.aReceber.reduce((t, a) => t + a.valor, 0);
  const vencido = r.vencidos.reduce((t, a) => t + a.valor, 0);
  const caiu = r.caiuNaConta + r.antecipacaoLiquida;
  const maior = Math.max(1, ...Object.values(r.pagoPorOrigem));
  const dia = sp.dia && sp.dia.startsWith(mes) && /^\d{4}-\d{2}-\d{2}$/.test(sp.dia) ? sp.dia : null;
  const lista = r.pagamentos.filter((p) => (!origem || p.origem === origem) && (!dia || p.data === dia));
  const link = (extra: Record<string, string>) => `/admin/financeiro?${new URLSearchParams({ mes, ...extra })}`;
  const hoje = hojeSP();
  const hojeDia = hoje.startsWith(mes) ? Number(hoje.slice(8, 10)) : null;
  const diasComVenda = r.porDia.filter((d) => d.total > 0);
  const [anoAnt, mAnt] = vizinho(mes, -1).split("-");

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/admin/financeiro?mes=${vizinho(mes, -1)}`} className="grid h-12 w-12 place-items-center rounded-full bg-white ring-1 ring-zinc-200" aria-label="Mês anterior">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-center font-heading text-3xl font-black uppercase tracking-tight sm:text-4xl">
          {NOME_MES[Number(m) - 1]} {ano}
        </h1>
        <Link href={`/admin/financeiro?mes=${vizinho(mes, 1)}`} className="grid h-12 w-12 place-items-center rounded-full bg-white ring-1 ring-zinc-200" aria-label="Próximo mês">
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>
      <p className="mt-2 text-center text-sm text-zinc-500">
        Só o que passa pelo Asaas. Dinheiro e maquininha ficam no grupo Caixa Caiçara.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero rotulo="Pago no mês" valor={r.pago} sub={`${r.pagamentos.length} pagamentos`} destaque />
        <Numero rotulo="Caiu na conta" valor={caiu} sub={r.antecipacaoLiquida ? `com ${brl(r.antecipacaoLiquida)} de antecipação` : undefined} />
        <Numero rotulo="A receber" valor={aReceber} sub={`${r.aReceber.length} até o fim do mês`} />
        <Numero rotulo="Vencido" valor={vencido} sub={`${r.vencidos.length} sem pagar`} alerta={r.vencidos.length > 0} />
      </div>
      <p className="mt-3 rounded-2xl bg-white p-4 text-lg ring-1 ring-zinc-200">
        Saldo na conta do Asaas agora: <strong>{brl(saldo)}</strong>
      </p>

      <Secao titulo="Pago por dia">
        <Legenda origens={ORDEM_ORIGEM} nomes={NOME_ORIGEM} />
        <BarrasPorDia dias={r.porDia} origens={ORDEM_ORIGEM} nomes={NOME_ORIGEM} mes={mes} diaAtivo={dia} />
        <p className="mt-2 text-xs text-zinc-500">
          Cartão parcelado conta inteiro no dia da compra. Toque numa barra para ver o dia.
        </p>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold">Ver em tabela ({diasComVenda.length} dias com pagamento)</summary>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-1 font-semibold">Dia</th>
                <th className="py-1 font-semibold">Maior origem</th>
                <th className="py-1 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {diasComVenda.map((d) => {
                const top = ORDEM_ORIGEM.reduce((a, b) => (d.porOrigem[b] > d.porOrigem[a] ? b : a));
                return (
                  <tr key={d.dia} className="border-t border-zinc-100">
                    <td className="py-1.5">
                      <Link href={`${link({ dia: d.dia })}#quem-pagou`} className="underline">
                        {dataCurta(d.dia)}
                      </Link>
                    </td>
                    <td className="py-1.5">{NOME_ORIGEM[top]}</td>
                    <td className="py-1.5 text-right font-semibold">{brl(d.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </details>
      </Secao>

      <Secao titulo="Acumulado no mês">
        <Acumulado
          atual={acumulado(r.porDia)}
          anterior={acumulado(anterior.resumo.porDia)}
          hojeDia={hojeDia}
          rotuloAtual={NOME_MES[Number(m) - 1]}
          rotuloAnterior={`${NOME_MES[Number(mAnt) - 1]}${anoAnt !== ano ? ` ${anoAnt}` : ""}`}
        />
        <p className="mt-2 text-xs text-zinc-500">
          Mesmo dia do mês, lado a lado: mostra se o mês está à frente ou atrás do anterior.
        </p>
      </Secao>

      <Secao titulo="Pago por origem">
        <div className="grid gap-3">
          {ORDEM_ORIGEM.map((o) => (
            <Link key={o} href={link(origem === o ? {} : { origem: o })} className="block">
              <div className="flex justify-between text-sm font-semibold">
                <span className={origem === o ? "underline" : ""}>{NOME_ORIGEM[o]}</span>
                <span>{brl(r.pagoPorOrigem[o])}</span>
              </div>
              <div className="mt-1 h-3 rounded-full bg-zinc-100">
                <div className="h-3 rounded-full bg-caicara-yellow" style={{ width: `${(r.pagoPorOrigem[o] / maior) * 100}%` }} />
              </div>
            </Link>
          ))}
        </div>
      </Secao>

      <Secao titulo="Saiu">
        <Linha rotulo="Taxas do Asaas" valor={r.taxas} />
        <Linha rotulo="Taxa de antecipação" valor={r.taxaAntecipacao} />
        <Linha rotulo="Transferido para o banco" valor={r.transferencias} nota="não é gasto: é o dinheiro indo para a sua conta" />
      </Secao>

      {r.vencidos.length ? (
        <Secao titulo={`Vencido (${r.vencidos.length})`}>
          <ListaAberta itens={r.vencidos} />
        </Secao>
      ) : null}

      <Secao titulo={`A receber até o fim do mês (${r.aReceber.length})`}>
        {r.aReceber.length ? <ListaAberta itens={r.aReceber} /> : <p className="text-zinc-500">Nada em aberto.</p>}
      </Secao>

      <div id="quem-pagou" className="scroll-mt-24" />
      <Secao titulo={`Quem pagou${origem ? ` · ${NOME_ORIGEM[origem]}` : ""}${dia ? ` · dia ${dataCurta(dia)}` : ""} (${lista.length})`}>
        {origem || dia ? (
          <Link href={link({})} className="mb-3 inline-block text-sm font-semibold underline">
            Ver tudo do mês
          </Link>
        ) : null}
        <ul className="divide-y divide-zinc-100">
          {lista.map((p, n) => (
            <li key={n} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-bold">{p.cliente}</p>
                <p className="truncate text-sm text-zinc-500">
                  {dataCurta(p.data)} · {NOME_ORIGEM[p.origem]} · {p.forma}
                  {p.parcelas > 1 ? ` ${p.parcelas}x` : ""}
                  {p.descricao ? ` · ${p.descricao}` : ""}
                </p>
                {p.caiEm ? <p className="text-xs text-zinc-400">cartão: cai a partir de {dataCurta(p.caiEm)}/{p.caiEm.slice(2, 4)}</p> : null}
              </div>
              <span className="shrink-0 font-bold">{brl(p.valor)}</span>
            </li>
          ))}
        </ul>
        {lista.length === 0 ? <p className="text-zinc-500">Nenhum pagamento.</p> : null}
      </Secao>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Link href={link({ atualizar: "1" })} className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white text-sm font-bold uppercase ring-1 ring-zinc-300">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Link>
        <a href={`/admin/financeiro.csv?mes=${mes}`} className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-black text-sm font-bold uppercase text-white">
          <Download className="h-4 w-4" /> CSV do mês
        </a>
        <a
          href={`/admin/financeiro.csv?mes=${mes}&tipo=dias`}
          className="col-span-2 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white text-sm font-bold uppercase ring-1 ring-zinc-300 sm:col-span-1"
        >
          <Download className="h-4 w-4" /> CSV por dia
        </a>
      </div>
    </div>
  );
}

function Numero({ rotulo, valor, sub, destaque, alerta }: { rotulo: string; valor: number; sub?: string; destaque?: boolean; alerta?: boolean }) {
  const cor = destaque ? "bg-black text-white" : alerta ? "bg-red-50 ring-1 ring-red-200" : "bg-white ring-1 ring-zinc-200";
  return (
    <div className={`rounded-3xl p-4 ${cor}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.14em] ${destaque ? "text-caicara-yellow" : alerta ? "text-red-700" : "text-zinc-500"}`}>{rotulo}</p>
      <p className="mt-1 font-heading text-2xl font-black sm:text-3xl">{brl(valor)}</p>
      {sub ? <p className={`text-xs ${destaque ? "text-zinc-300" : "text-zinc-500"}`}>{sub}</p> : null}
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
      <h2 className="mb-4 font-heading text-xl font-black uppercase">{titulo}</h2>
      {children}
    </section>
  );
}

function Linha({ rotulo, valor, nota }: { rotulo: string; valor: number; nota?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-zinc-100 py-2 last:border-0">
      <div>
        <p className="font-semibold">{rotulo}</p>
        {nota ? <p className="text-xs text-zinc-500">{nota}</p> : null}
      </div>
      <span className="font-bold">{brl(valor)}</span>
    </div>
  );
}

function ListaAberta({ itens }: { itens: Aberto[] }) {
  return (
    <ul className="divide-y divide-zinc-100">
      {itens.map((a, n) => (
        <li key={n} className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="font-bold">{a.cliente}</p>
            <p className="truncate text-sm text-zinc-500">
              vence {dataCurta(a.vencimento)} · {NOME_ORIGEM[a.origem]}
              {a.descricao ? ` · ${a.descricao}` : ""}
            </p>
          </div>
          <span className="shrink-0 font-bold">{brl(a.valor)}</span>
        </li>
      ))}
    </ul>
  );
}

function Aviso({ texto, mes }: { texto: string; mes?: string }) {
  return (
    <div className="container py-10">
      <p className="rounded-3xl bg-amber-50 p-6 text-lg font-semibold text-amber-900 ring-1 ring-amber-200">{texto}</p>
      {mes ? (
        <Link href={`/admin/financeiro?mes=${mes}&atualizar=1`} className="mt-4 inline-flex h-14 items-center rounded-full bg-black px-6 font-bold text-white">
          Atualizar
        </Link>
      ) : null}
    </div>
  );
}
