"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, Copy, CreditCard, Loader2 } from "lucide-react";
import { reais } from "./reais";
import { Retirada } from "./Retirada";

type Status = "aguardando" | "pago" | "entregue" | "expirado" | "cancelado" | "pago_sem_peca";

interface DadosPedido {
  status: Status;
  total: number;
  forma: string;
  itens: { descricao: string; qtd: number; precoUnit: number }[];
  pixQr: string | null;
  pixCopiaCola: string | null;
  invoiceUrl: string | null;
  reservadoAte: string | null;
}

const INTERVALO_MS = 5000;

const botaoPrincipal =
  "inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-caicara-yellow px-8 text-sm font-bold uppercase tracking-[0.14em] text-black transition-transform hover:-translate-y-0.5 disabled:opacity-60";

const cardClass = "rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5 sm:p-8";

function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function comoPagou(forma: string) {
  if (forma === "pix" || forma === "balcao_pix") return "no Pix";
  if (forma === "cartao2") return "em 2x no cartão";
  if (forma === "cartao1" || forma === "balcao_cartao") return "no cartão";
  if (forma === "balcao_dinheiro") return "em dinheiro";
  return "";
}

export function PedidoStatus({ codigo }: { codigo: string }) {
  const [pedido, setPedido] = useState<DadosPedido | null>(null);
  const [naoAchei, setNaoAchei] = useState(false);
  const [falhaRede, setFalhaRede] = useState(false);

  const buscar = useCallback(async () => {
    try {
      const response = await fetch(`/api/loja/pedidos/${encodeURIComponent(codigo)}`, { cache: "no-store" });
      if (response.status === 404) {
        setNaoAchei(true);
        return;
      }
      if (!response.ok) throw new Error(String(response.status));
      setPedido((await response.json()) as DadosPedido);
      setFalhaRede(false);
    } catch {
      setFalhaRede(true);
    }
  }, [codigo]);

  const status = pedido?.status;

  // Vindo do checkout, a página herdaria a rolagem do formulário: abre sempre no topo.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Primeira leitura e, enquanto aguarda pagamento, uma consulta a cada 5 s.
    if (status !== undefined && status !== "aguardando") return;
    const primeira = status === undefined ? setTimeout(buscar, 0) : undefined;
    const timer = setInterval(buscar, INTERVALO_MS);
    return () => {
      clearTimeout(primeira);
      clearInterval(timer);
    };
  }, [buscar, status]);

  if (naoAchei) {
    return (
      <div className={`${cardClass} text-center`}>
        <h2 className="font-heading text-3xl font-black uppercase tracking-tight">Pedido não encontrado</h2>
        <p className="mt-3 text-zinc-600">Confere o link que chegou no WhatsApp.</p>
        <Link href="/loja" className="mt-6 inline-flex font-semibold underline">
          Ir para a loja
        </Link>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        {falhaRede ? <p className="text-sm">Sem conexão. Tentando de novo…</p> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <div>
        {pedido.status === "aguardando" ? <Aguardando pedido={pedido} /> : null}
        {pedido.status === "expirado" ? <Expirado codigo={codigo} onReativado={buscar} /> : null}
        {pedido.status === "pago" || pedido.status === "entregue" || pedido.status === "pago_sem_peca" ? (
          <Pago status={pedido.status} />
        ) : null}
        {pedido.status === "cancelado" ? (
          <div className={`${cardClass} text-center`}>
            <h2 className="font-heading text-3xl font-black uppercase tracking-tight">Pedido cancelado</h2>
            <p className="mt-3 text-zinc-600">Nada foi cobrado. Quer fazer outro?</p>
            <Link href="/loja" className={`mt-6 ${botaoPrincipal}`}>
              Ir para a loja
            </Link>
          </div>
        ) : null}
        {falhaRede ? <p className="mt-3 text-center text-sm text-zinc-500">Sem conexão. Tentando de novo…</p> : null}
      </div>

      <Resumo pedido={pedido} />
    </div>
  );
}

function Aguardando({ pedido }: { pedido: DadosPedido }) {
  const [copiado, setCopiado] = useState(false);
  const ehPix = pedido.forma === "pix";

  async function copiar() {
    if (!pedido.pixCopiaCola) return;
    try {
      await navigator.clipboard.writeText(pedido.pixCopiaCola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // navegador sem permissão: o código continua visível pra copiar na mão
    }
  }

  return (
    <div className={`${cardClass} text-center`}>
      <span className="inline-flex rounded-full bg-caicara-yellow/20 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-800">
        Pedido feito
      </span>
      <h2 className="mt-4 font-heading text-3xl font-black uppercase tracking-tight">
        {ehPix ? `Falta o Pix de ${reais(pedido.total)}` : `Falta pagar ${reais(pedido.total)}`}
      </h2>
      {pedido.reservadoAte ? (
        <p className="mt-2 inline-flex items-center gap-2 text-zinc-600">
          <Clock className="h-4 w-4" />
          Sua peça fica reservada até {hora(pedido.reservadoAte)}.
        </p>
      ) : null}

      {ehPix && pedido.pixQr ? (
        <>
          <p className="mt-4 text-zinc-600">Aponta a câmera do app do banco ou usa o copia e cola.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${pedido.pixQr}`}
            alt="QR Code Pix do pedido"
            className="mx-auto mt-6 h-56 w-56 rounded-2xl border border-zinc-200"
          />
        </>
      ) : null}

      {ehPix && pedido.pixCopiaCola ? (
        <>
          <div className="mt-6 break-all rounded-2xl bg-zinc-50 p-4 text-left text-xs text-zinc-600">
            {pedido.pixCopiaCola}
          </div>
          <button type="button" onClick={copiar} className={`mt-4 ${botaoPrincipal}`}>
            <Copy className="h-5 w-5" />
            {copiado ? "Copiado!" : "Copiar código"}
          </button>
        </>
      ) : null}

      {ehPix && !pedido.pixQr && !pedido.pixCopiaCola && pedido.invoiceUrl ? (
        <a href={pedido.invoiceUrl} className={`mt-6 ${botaoPrincipal}`}>
          Pagar pela fatura do Asaas
        </a>
      ) : null}

      {!ehPix && pedido.invoiceUrl ? (
        <a href={pedido.invoiceUrl} className={`mt-6 ${botaoPrincipal}`}>
          <CreditCard className="h-5 w-5" />
          Pagar com cartão
        </a>
      ) : null}

      <p className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Esperando o pagamento. Esta tela atualiza sozinha.
      </p>
    </div>
  );
}

function Expirado({ codigo, onReativado }: { codigo: string; onReativado: () => Promise<void> }) {
  const [cpf, setCpf] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [esgotou, setEsgotou] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const response = await fetch(`/api/loja/pedidos/${encodeURIComponent(codigo)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "reativar", cpf }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.motivo === "estoque") setEsgotou(true);
        else setError(typeof data.error === "string" ? data.error : "Não deu agora. Tenta de novo.");
        setEnviando(false);
        return;
      }
      await onReativado();
    } catch {
      setError("Sem conexão. Tenta de novo.");
    }
    setEnviando(false);
  }

  if (esgotou) {
    return (
      <div className={`${cardClass} text-center`}>
        <h2 className="font-heading text-3xl font-black uppercase tracking-tight">Esgotou 😕</h2>
        <p className="mt-3 text-zinc-600">A peça acabou enquanto a reserva estava vencida. Nada foi cobrado.</p>
        <Link href="/loja" className={`mt-6 ${botaoPrincipal}`}>
          Ver o que tem na loja
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cardClass}>
      <h2 className="font-heading text-3xl font-black uppercase tracking-tight">Sua reserva venceu</h2>
      <p className="mt-3 text-zinc-600">
        Ainda dá pra garantir, se tiver estoque. Digita o CPF de novo: ele não fica salvo aqui.
      </p>
      <label className="mt-6 grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">CPF</span>
        <input
          required
          name="cpf"
          inputMode="numeric"
          autoComplete="off"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          className="h-14 rounded-2xl border border-zinc-300 px-4 text-lg outline-none focus:border-black"
          placeholder="000.000.000-00"
        />
      </label>
      {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}
      <button type="submit" disabled={enviando} className={`mt-6 ${botaoPrincipal}`}>
        {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Garantir de novo
      </button>
    </form>
  );
}

function Pago({ status }: { status: "pago" | "entregue" | "pago_sem_peca" }) {
  return (
    <div className="rounded-[2rem] border border-green-200 bg-green-50 p-8 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
      <h2 className="mt-4 font-heading text-3xl font-black uppercase tracking-tight">Pago ✅</h2>
      {status === "pago" ? (
        <p className="mt-3 text-lg text-zinc-700">Tá tudo certo. É só retirar no box e mostrar este pedido no balcão.</p>
      ) : null}
      {status === "entregue" ? <p className="mt-3 text-lg text-zinc-700">Pedido já entregue. Bom treino!</p> : null}
      {status === "pago_sem_peca" ? (
        <p className="mt-3 text-lg text-zinc-700">
          O pagamento chegou depois da reserva vencer e a peça acabou. A gente te chama no WhatsApp pra trocar o
          tamanho ou devolver o dinheiro.
        </p>
      ) : null}
    </div>
  );
}

function Resumo({ pedido }: { pedido: DadosPedido }) {
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">Itens</h3>
        <ul className="mt-3 grid gap-2">
          {pedido.itens.map((i) => (
            <li key={i.descricao} className="flex justify-between gap-4 text-zinc-800">
              <span>
                {i.qtd}× {i.descricao}
              </span>
              <span className="shrink-0 font-semibold">{reais(i.precoUnit * i.qtd)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-zinc-100 pt-4">
          <span className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">Total</span>
          <span className="text-right">
            <span className="font-heading text-2xl font-black">{reais(pedido.total)}</span>
            <span className="block text-xs text-zinc-500">{comoPagou(pedido.forma)}</span>
          </span>
        </div>
      </div>
      <Retirada />
    </div>
  );
}
