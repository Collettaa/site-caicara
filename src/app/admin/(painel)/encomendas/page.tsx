import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { exigirAdmin } from "@/lib/admin-auth";
import { type Encomenda, FORMAS, NOME_FORMA, NOME_STATUS, type StatusEncomenda, hojeSP, lerCaixa } from "@/lib/caixa";
import { getDb } from "@/lib/loja/db";
import { listarTodos } from "@/lib/loja/produtos";
import { BotaoAcao } from "../BotaoAcao";
import { Recado, Secao, botaoPreto, brl, campo, dataCurta } from "../ui";
import { apagarEncomendaAction, desfazerPagoAction, pagarEncomendaAction, salvarEncomendaAction, statusEncomendaAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Encomendas" };

const PROXIMO: Record<StatusEncomenda, { para: StatusEncomenda; rotulo: string } | null> = {
  pedido: { para: "chegou", rotulo: "Chegou no box" },
  chegou: { para: "entregue", rotulo: "Entreguei" },
  entregue: null,
};

export default async function EncomendasPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await exigirAdmin();
  const sp = await searchParams;
  const hoje = hojeSP();
  const { encomendas } = await lerCaixa();
  const lista = [...encomendas].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  const porStatus = (s: StatusEncomenda) => lista.filter((e) => e.status === s);
  const aReceber = lista.filter((e) => !e.pagoEm).reduce((t, e) => t + e.valor, 0);
  const itens = [...new Set(encomendas.map((e) => e.item))];

  // O que falta pedir ao fornecedor: soma do que está "encomendado", por item.
  const pedir = new Map<string, number>();
  for (const e of porStatus("pedido")) pedir.set(e.item, (pedir.get(e.item) ?? 0) + e.qtd);

  let produtos: ReturnType<typeof listarTodos> = [];
  try {
    produtos = listarTodos(getDb()).filter((p) => p.ativo);
  } catch {
    produtos = [];
  }

  return (
    <div className="container max-w-2xl py-6 pb-16">
      <h1 className="font-heading text-4xl font-black uppercase tracking-tight">Encomendas</h1>
      <p className="mt-1 text-zinc-600">Produto vendido sob encomenda (grip, munhequeira…): anota quem pediu, marca quando chega e quando entrega.</p>

      {sp.ok ? <Recado tipo="ok">Encomenda salva.</Recado> : null}
      {sp.erro ? <Recado tipo="erro">Preencha quem, o quê e o valor.</Recado> : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-3xl bg-caicara-yellow p-4">
          <p className="text-sm font-semibold">Pedir ao fornecedor</p>
          {pedir.size ? (
            <ul className="mt-1">
              {[...pedir].map(([item, qtd]) => (
                <li key={item} className="font-heading text-lg font-black leading-tight">
                  {qtd}× {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 font-heading text-lg font-black">nada</p>
          )}
        </div>
        <div className="rounded-3xl bg-white p-4 ring-1 ring-zinc-200">
          <p className="text-sm font-semibold text-zinc-500">Falta receber</p>
          <p className="mt-1 font-heading text-2xl font-black tabular-nums">{brl(aReceber)}</p>
        </div>
      </div>

      <Secao titulo="Nova encomenda">
        <FormEncomenda itens={itens} />
      </Secao>

      {(["pedido", "chegou"] as const).map((s) => {
        const doStatus = porStatus(s);
        return doStatus.length ? (
          <section key={s} className="mt-6">
            <h2 className="text-sm font-bold text-zinc-500">
              {NOME_STATUS[s]} ({doStatus.length})
            </h2>
            <ul className="mt-2 grid gap-2">
              {doStatus.map((e) => (
                <Cartao key={e.id} e={e} hoje={hoje} />
              ))}
            </ul>
          </section>
        ) : null;
      })}
      {porStatus("entregue").length ? (
        <details className="mt-6">
          <summary className="flex min-h-12 cursor-pointer items-center text-sm font-bold text-zinc-500">Entregues ({porStatus("entregue").length})</summary>
          <ul className="mt-2 grid gap-2">
            {porStatus("entregue").map((e) => (
              <Cartao key={e.id} e={e} hoje={hoje} />
            ))}
          </ul>
        </details>
      ) : null}

      <Secao titulo="Estoque da loja" extra={<Link href="/admin/produtos" className="text-sm font-semibold underline">Mudar estoque</Link>}>
        {produtos.length === 0 ? <p className="text-zinc-500">Nenhum produto ativo na loja.</p> : null}
        <ul className="grid gap-4">
          {produtos.map((p) => {
            const vs = p.variacoes.filter((v) => v.ativo);
            const total = vs.reduce((t, v) => t + v.estoque, 0);
            return (
              <li key={p.id}>
                <div className="flex justify-between font-bold">
                  <span>{p.nome}</span>
                  <span className={total ? "" : "text-red-600"}>{total} un.</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {vs.map((v) => (
                    <span key={v.id} className={`rounded-full px-3 py-1 text-sm ${v.estoque ? "bg-zinc-100" : "bg-red-50 text-red-600 line-through"}`}>
                      {[v.modelo, v.tamanho].filter(Boolean).join(" ")} · {v.estoque}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </Secao>
    </div>
  );
}

function Cartao({ e, hoje }: { e: Encomenda; hoje: string }) {
  const prox = PROXIMO[e.status];
  return (
    <li id={`e-${e.id}`} className="scroll-mt-24 rounded-3xl border border-zinc-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pl-1">
          <p className="break-words text-lg font-bold leading-snug">{e.cliente}</p>
          <p className="text-sm text-zinc-500">
            {e.qtd > 1 ? `${e.qtd}× ` : ""}
            {e.item} · pedido {dataCurta(e.criadoEm.slice(0, 10))}
            {e.obs ? ` · ${e.obs}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-heading text-xl font-black tabular-nums">{brl(e.valor)}</p>
          <p className={`text-xs font-bold ${e.pagoEm ? "text-green-700" : "text-red-600"}`}>
            {e.pagoEm ? `pago ${dataCurta(e.pagoEm)} · ${e.formaPagamento === "asaas" ? "Asaas" : NOME_FORMA[e.formaPagamento as keyof typeof NOME_FORMA]}` : "não pagou"}
          </p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {prox ? (
          <BotaoAcao acao={statusEncomendaAction.bind(null, e.id, prox.para)} className="bg-black text-white">
            {prox.rotulo}
          </BotaoAcao>
        ) : (
          <p className="flex h-14 items-center justify-center gap-2 rounded-full bg-zinc-100 text-sm font-bold text-zinc-500">
            <Check className="h-5 w-5" /> Entregue
          </p>
        )}
        {e.pagoEm ? (
          <BotaoAcao acao={desfazerPagoAction.bind(null, e.id)} confirmar="Desfazer o pagamento? Sai do caixa também." className="bg-white text-zinc-600 ring-1 ring-zinc-300">
            Desfazer pago
          </BotaoAcao>
        ) : (
          <details className="col-span-1 [&[open]]:col-span-2 [&[open]>summary]:hidden">
            <summary className={`${botaoPreto} w-full cursor-pointer list-none bg-green-700 [&::-webkit-details-marker]:hidden`}>Recebi</summary>
            <form action={pagarEncomendaAction.bind(null, e.id)} className="grid grid-cols-2 gap-2">
              <select name="forma" defaultValue="pix" aria-label="Como pagou" className={campo}>
                <option value="asaas">Link do Asaas</option>
                {FORMAS.map((f) => (
                  <option key={f} value={f}>
                    {f === "pix" ? "Pix no banco" : NOME_FORMA[f]}
                  </option>
                ))}
              </select>
              <input name="data" type="date" required defaultValue={hoje} max={hoje} aria-label="Data" className={campo} />
              <button className={`${botaoPreto} col-span-2 bg-green-700`}>Confirmar {brl(e.valor)}</button>
              <p className="col-span-2 text-xs text-zinc-500">Fora do Asaas vira entrada no caixa. Pelo link do Asaas já aparece lá.</p>
            </form>
          </details>
        )}
      </div>

      <details className="mt-1">
        <summary className="flex min-h-11 cursor-pointer items-center justify-end text-sm font-semibold text-zinc-500">Editar</summary>
        <FormEncomenda e={e} itens={[]} />
        <div className="mt-2">
          <BotaoAcao acao={apagarEncomendaAction.bind(null, e.id)} confirmar={`Apagar a encomenda de ${e.cliente}?`} className="border border-red-300 bg-white text-red-600">
            Apagar
          </BotaoAcao>
        </div>
      </details>
    </li>
  );
}

function FormEncomenda({ e, itens }: { e?: Encomenda; itens: string[] }) {
  return (
    <form action={salvarEncomendaAction.bind(null, e?.id ?? null)} className="grid gap-2">
      <input name="cliente" required minLength={2} maxLength={80} defaultValue={e?.cliente} placeholder="Quem pediu" aria-label="Quem pediu" className={campo} />
      <div className="grid grid-cols-[1fr_5rem] gap-2">
        <input name="item" required minLength={2} list="itens-encomenda" defaultValue={e?.item} placeholder="O quê? Ex.: grip M" aria-label="Item" className={campo} />
        <input name="qtd" type="number" min={1} max={99} defaultValue={e?.qtd ?? 1} aria-label="Quantidade" className={campo} />
      </div>
      <datalist id="itens-encomenda">
        {itens.map((i) => (
          <option key={i} value={i} />
        ))}
      </datalist>
      <input name="valor" inputMode="decimal" required defaultValue={e ? String(e.valor).replace(".", ",") : ""} placeholder="Valor total R$" aria-label="Valor total" className={`${campo} font-heading text-xl`} />
      <input name="obs" maxLength={200} defaultValue={e?.obs} placeholder="Observação (opcional). Ex.: cor preta" aria-label="Observação" className={campo} />
      <button className={botaoPreto}>{e ? "Salvar" : "Anotar encomenda"}</button>
    </form>
  );
}
