import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, MessageCircle } from "lucide-react";
import { reais } from "@/components/loja/reais";
import { getDb } from "@/lib/loja/db";
import { type PedidoComItens, listarPorStatus } from "@/lib/loja/pedidos";
import { listarTodos } from "@/lib/loja/produtos";
import type { Forma } from "@/lib/loja/tipos";
import { cancelarAction, entregarAction } from "./actions";
import { type Aba, ERRO, MSG, abaValida, textoDe } from "./avisos";
import { BotaoAcao } from "./BotaoAcao";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pedidos" };

const ABAS: { id: Aba; label: string }[] = [
  { id: "entregar", label: "Para entregar" },
  { id: "aguardando", label: "Aguardando" },
  { id: "entregues", label: "Entregues" },
];
const MAX_ENTREGUES = 50;
const SETE_DIAS = 7 * 24 * 60 * 60 * 1000;

const NOME_FORMA: Record<Forma, string> = {
  pix: "Pix",
  cartao1: "Cartão 1x",
  cartao2: "Cartão 2x",
  balcao_dinheiro: "Dinheiro · balcão",
  balcao_pix: "Pix · balcão",
  balcao_cartao: "Maquininha · balcão",
};

const formatoData = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const formatoHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});
const quando = (iso: string | null) => (iso ? formatoData.format(new Date(iso)).replace(",", "") : "—");

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; msg?: string; erro?: string; ajuste?: string }>;
}) {
  const sp = await searchParams;
  const aba = abaValida(sp.aba);
  // Só códigos conhecidos viram texto; nada da URL é exibido literal.
  const ok = textoDe(MSG, sp.msg);
  const erro = textoDe(ERRO, sp.erro);
  const db = getDb();
  const agora = new Date().getTime(); // página dinâmica: lida a cada visita

  // Pago sem peça no topo; depois os pagos, do mais antigo (espera há mais tempo) ao mais novo.
  const paraEntregar = [
    ...listarPorStatus(db, ["pago_sem_peca"]),
    ...listarPorStatus(db, ["pago"]).sort((a, b) => (a.pagoEm ?? "").localeCompare(b.pagoEm ?? "")),
  ];
  const aguardando = listarPorStatus(db, ["aguardando"]);
  const entregues = listarPorStatus(db, ["entregue"]);
  const lista = { entregar: paraEntregar, aguardando, entregues: entregues.slice(0, MAX_ENTREGUES) }[aba];
  const total = { entregar: paraEntregar.length, aguardando: aguardando.length, entregues: entregues.length };

  // Entregou "pago sem peça" com outro tamanho: aponta os produtos onde tirar a peça.
  const pedidoAjuste = sp.ajuste ? entregues.find((p) => String(p.id) === sp.ajuste) : undefined;
  const produtosAjuste = pedidoAjuste ? produtosDoPedido(pedidoAjuste) : [];

  return (
    <div className="container py-6">
      <h1 className="font-heading text-4xl font-black uppercase tracking-tight">Pedidos</h1>

      {pedidoAjuste ? (
        <div className="mt-4 rounded-2xl border-2 border-amber-500 bg-amber-50 p-4">
          <p className="flex items-start gap-2 font-bold text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            Tira com o botão − a peça que você entregou.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {produtosAjuste.map((p) => (
              <Link
                key={p.id}
                href={`/admin/produtos/${p.id}`}
                className="inline-flex h-12 items-center rounded-full bg-black px-5 text-sm font-bold uppercase tracking-[0.12em] text-white"
              >
                {p.nome}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {ok ? (
        <p className="mt-4 flex items-center gap-2 rounded-2xl bg-green-100 p-4 font-semibold text-green-900">
          <CheckCircle2 className="h-5 w-5" />
          {ok}
        </p>
      ) : null}
      {erro ? <p className="mt-4 rounded-2xl bg-red-100 p-4 font-semibold text-red-800">{erro}</p> : null}

      <div className="mt-5 grid grid-cols-3 gap-2">
        {ABAS.map((a) => (
          <Link
            key={a.id}
            href={`/admin?aba=${a.id}`}
            className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 text-center text-xs font-bold uppercase tracking-[0.08em] ${
              a.id === aba ? "bg-black text-white" : "bg-white text-zinc-700 ring-1 ring-zinc-200"
            }`}
          >
            {a.label}
            <span className="text-lg leading-none">{total[a.id]}</span>
          </Link>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="mt-8 text-center text-zinc-500">Nada aqui.</p>
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {lista.map((p) => (
            <CartaoPedido key={p.id} pedido={p} aba={aba} agora={agora} />
          ))}
        </ul>
      )}
      {aba === "entregues" && entregues.length > MAX_ENTREGUES ? (
        <p className="mt-4 text-center text-sm text-zinc-500">
          Mostrando os {MAX_ENTREGUES} mais recentes. O resto está no CSV.
        </p>
      ) : null}
    </div>
  );
}

function produtosDoPedido(pedido: PedidoComItens): { id: number; nome: string }[] {
  const variacoes = new Set(pedido.itens.map((i) => i.variacaoId));
  return listarTodos(getDb())
    .filter((p) => p.variacoes.some((v) => variacoes.has(v.id)))
    .map((p) => ({ id: p.id, nome: p.nome }));
}

function CartaoPedido({ pedido: p, aba, agora }: { pedido: PedidoComItens; aba: Aba; agora: number }) {
  const semPeca = p.status === "pago_sem_peca";
  const atrasado = p.status === "pago" && p.pagoEm !== null && agora - new Date(p.pagoEm).getTime() > SETE_DIAS;
  const destaque = semPeca
    ? "border-2 border-red-500 bg-red-50"
    : atrasado
      ? "border-2 border-amber-500 bg-amber-50"
      : "border border-zinc-200 bg-white";

  return (
    <li className={`rounded-3xl p-4 ${destaque}`}>
      {semPeca ? (
        <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-red-700">
          <AlertTriangle className="h-4 w-4" /> Pago sem peça — troca o tamanho ou estorna no Asaas
        </p>
      ) : null}
      {atrasado ? (
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.08em] text-amber-800">
          Pago há mais de 7 dias sem retirar
        </p>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-bold leading-tight">{p.nome}</p>
        <p className="shrink-0 text-lg font-black">{reais(p.total)}</p>
      </div>
      <ul className="mt-2 text-zinc-800">
        {p.itens.map((i) => (
          <li key={i.id}>
            {i.qtd}x {i.descricao}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-zinc-500">
        {NOME_FORMA[p.forma]} ·{" "}
        {aba === "aguardando"
          ? `pedido ${quando(p.criadoEm)} · reserva até ${p.reservadoAte ? formatoHora.format(new Date(p.reservadoAte)) : "—"}`
          : aba === "entregues"
            ? `entregue ${quando(p.entregueEm)}`
            : `pago ${quando(p.pagoEm)}`}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {aba === "entregar" ? (
          <div className="col-span-2">
            <BotaoAcao acao={entregarAction.bind(null, p.id)} className="bg-caicara-yellow text-black">
              Entregue
            </BotaoAcao>
          </div>
        ) : null}
        {p.whatsapp ? (
          <a
            href={`https://wa.me/${p.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-green-600 px-5 text-sm font-bold uppercase tracking-[0.12em] text-white"
          >
            <MessageCircle className="h-5 w-5" /> WhatsApp
          </a>
        ) : null}
        {aba !== "entregues" ? (
          <BotaoAcao
            acao={cancelarAction.bind(null, p.id, aba)}
            confirmar={`Cancelar o pedido de ${p.nome}? ${
              p.status === "pago_sem_peca" ? "" : "A peça volta para o estoque. "
            }Se já foi pago, o estorno é no Asaas.`}
            className="border border-zinc-300 bg-white text-zinc-700"
          >
            Cancelar
          </BotaoAcao>
        ) : null}
      </div>
    </li>
  );
}
