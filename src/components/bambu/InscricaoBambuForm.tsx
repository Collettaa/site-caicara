"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Minus, Plus } from "lucide-react";

const CAMPO =
  "h-14 rounded-xl border-2 border-[#09300b] bg-white px-4 text-lg text-[#09300b] outline-none focus:shadow-[3px_3px_0_#09300b]";
const OPCAO =
  "flex min-h-14 items-center justify-center rounded-xl border-2 border-[#09300b] px-3 py-2 text-center font-heading text-lg font-bold uppercase leading-tight text-[#09300b] transition-transform active:translate-x-[2px] active:translate-y-[2px] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#09300b]";
const OPCAO_ON = "bg-[#09300b] text-[#f0c94c] shadow-none";
const OPCAO_OFF = "bg-white shadow-[3px_3px_0_#09300b]";
const BOTAO =
  "inline-flex h-16 w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#09300b] bg-[#f0c94c] px-6 font-heading text-xl font-bold uppercase text-[#09300b] shadow-[4px_4px_0_#09300b] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#09300b]";
const PASSO =
  "flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#09300b] bg-white text-[#09300b] transition-transform active:scale-90 disabled:border-dashed disabled:opacity-30 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#09300b]";
const CAIXA = "rounded-3xl border-2 border-[#09300b] bg-[#fdf3c4] p-5 text-[#09300b] shadow-[6px_6px_0_#09300b]";

const TAMANHOS = ["P", "M", "G", "GG"] as const;
type Tam = (typeof TAMANHOS)[number];
type Forma = "pix" | "cartao";
type Cobranca = { forma: Forma; paymentId: string; invoiceUrl: string; total: number; qrCodeImage?: string; copiaECola?: string };

type Props = {
  quando: string;
  inscricoesAbertas: boolean;
  /** null = camiseta não está à venda agora. */
  camiseta: { valor: number; pedidoAte: string; brinde: string; max: number; livres: Record<Tam, number> } | null;
};

const descrever = (q: Record<Tam, number>) =>
  TAMANHOS.filter((t) => q[t])
    .map((t) => `${q[t]} ${t}`)
    .join(", ");

export function InscricaoBambuForm({ quando, inscricoesAbertas, camiseta }: Props) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [corre, setCorre] = useState(inscricoesAbertas);
  const [compra, setCompra] = useState(!inscricoesAbertas);
  const [qtd, setQtd] = useState<Record<Tam, number>>({ P: 0, M: 0, G: 0, GG: 0 });
  const [forma, setForma] = useState<Forma>("pix");
  const [cpf, setCpf] = useState("");
  const [site, setSite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [cobranca, setCobranca] = useState<Cobranca | null>(null);
  const [error, setError] = useState("");

  const comCamiseta = Boolean(camiseta && compra);
  const pecas = TAMANHOS.reduce((n, t) => n + qtd[t], 0);
  const total = camiseta ? pecas * camiseta.valor : 0;

  function mudar(t: Tam, delta: number) {
    setQtd((q) => ({ ...q, [t]: Math.max(0, q[t] + delta) }));
  }

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!corre && !comCamiseta) {
      setError("Escolhe participar, a camiseta ou os dois.");
      return;
    }
    if (comCamiseta && pecas === 0) {
      setError("Escolhe o tamanho e quantas camisetas.");
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch("/api/corrida-bambu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          whatsapp,
          site,
          corre,
          itens: comCamiseta ? qtd : undefined,
          forma: comCamiseta ? forma : undefined,
          cpf: comCamiseta ? cpf : undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Não deu pra enviar. Tenta de novo.");
        setStatus("idle");
        return;
      }
      setCobranca(data.cobranca ?? null);
      setStatus("done");
    } catch {
      setError("Sem conexão. Tenta de novo.");
      setStatus("idle");
    }
  }

  if (status === "done" && cobranca && camiseta) {
    return <PagarCamiseta cobranca={cobranca} itens={descrever(qtd)} corre={corre} quando={quando} brinde={camiseta.brinde} />;
  }

  if (status === "done") {
    return (
      <div className={`${CAIXA} p-6 text-center`}>
        <CheckCircle2 className="mx-auto h-12 w-12" />
        <p className="mt-3 font-heading text-3xl font-bold uppercase">Tá dentro!</p>
        <p className="mt-2 text-lg">{quando}. Vem de tênis e com fôlego pro pagode depois.</p>
      </div>
    );
  }

  const textoBotao = !comCamiseta
    ? "Quero participar"
    : pecas === 0
      ? "Escolhe as camisetas"
      : forma === "pix"
        ? `${corre ? "Participar e gerar" : "Gerar"} Pix de R$ ${total}`
        : `${corre ? "Participar e pagar" : "Pagar"} R$ ${total}`;

  return (
    <form onSubmit={enviar} className={`grid gap-5 ${CAIXA}`}>
      {camiseta ? (
        <fieldset className="grid gap-2">
          <legend className="mb-2 font-heading text-xl font-semibold">O que você quer?</legend>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={corre}
              disabled={!inscricoesAbertas}
              onClick={() => setCorre((v) => !v)}
              className={`${OPCAO} ${corre ? OPCAO_ON : OPCAO_OFF} disabled:opacity-40`}
            >
              Treinão
              <br />
              (grátis)
            </button>
            <button type="button" aria-pressed={compra} onClick={() => setCompra((v) => !v)} className={`${OPCAO} ${compra ? OPCAO_ON : OPCAO_OFF}`}>
              Camiseta
              <br />
              (R$ {camiseta.valor})
            </button>
          </div>
          <p className="text-sm">Dá pra marcar os dois. Pra comprar camiseta não precisa participar.</p>
        </fieldset>
      ) : null}

      <label className="grid gap-2">
        <span className="font-heading text-xl font-semibold">Nome</span>
        <input required name="nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} className={CAMPO} placeholder="Seu nome" />
      </label>
      <label className="grid gap-2">
        <span className="font-heading text-xl font-semibold">WhatsApp</span>
        <input
          required
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className={CAMPO}
          placeholder="(13) 99999-9999"
        />
      </label>

      {camiseta && compra ? (
        <fieldset className="grid gap-3">
          <legend className="mb-1 font-heading text-xl font-semibold">Camisetas</legend>
          <ul className="divide-y divide-[#09300b]/20 rounded-xl border-2 border-[#09300b] bg-white px-3">
            {TAMANHOS.map((t) => {
              const livre = camiseta.livres[t] ?? 0;
              const esgotou = livre < 1;
              return (
                <li key={t} className="flex items-center justify-between gap-3 py-2">
                  <span className={`font-heading text-2xl font-bold ${esgotou ? "line-through opacity-40" : ""}`}>{t}</span>
                  {esgotou ? (
                    <span className="text-sm font-semibold text-red-700">esgotou</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button type="button" className={PASSO} disabled={qtd[t] === 0} onClick={() => mudar(t, -1)} aria-label={`Tirar uma ${t}`}>
                        <Minus className="h-5 w-5" />
                      </button>
                      <output className="w-6 text-center font-heading text-2xl font-bold tabular-nums" aria-live="polite" aria-label={`Camisetas ${t}`}>
                        {qtd[t]}
                      </output>
                      <button
                        type="button"
                        className={PASSO}
                        disabled={qtd[t] >= livre || pecas >= camiseta.max}
                        onClick={() => mudar(t, 1)}
                        aria-label={`Pôr mais uma ${t}`}
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-base">
            {pecas > 0 ? (
              <>
                <strong>
                  {pecas} camiseta{pecas > 1 ? "s" : ""}: R$ {total}
                </strong>
                . Cada uma vale {camiseta.brinde}.
              </>
            ) : (
              <>Dry fit, medidas na etiqueta lá em cima. Cada camiseta vale {camiseta.brinde}.</>
            )}{" "}
            Pedido até {camiseta.pedidoAte}, retira no dia do treinão.
          </p>
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Pagamento">
            {(["pix", "cartao"] as const).map((f) => (
              <button key={f} type="button" aria-pressed={forma === f} onClick={() => setForma(f)} className={`${OPCAO} ${forma === f ? OPCAO_ON : OPCAO_OFF}`}>
                {f === "pix" ? "Pix" : "Cartão 1x"}
              </button>
            ))}
          </div>
          <label className="grid gap-2">
            <span className="font-heading text-xl font-semibold">CPF</span>
            <input required name="cpf" inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value)} className={CAMPO} placeholder="Só pra gerar a cobrança" />
          </label>
        </fieldset>
      ) : null}

      <input type="text" name="site" tabIndex={-1} autoComplete="off" value={site} onChange={(e) => setSite(e.target.value)} className="hidden" aria-hidden="true" />
      {error ? (
        <p role="alert" className="rounded-xl border-2 border-red-700 bg-red-50 px-4 py-3 font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={status === "sending"} className={BOTAO}>
        {status === "sending" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {textoBotao}
      </button>
    </form>
  );
}

function PagarCamiseta({ cobranca, itens, corre, quando, brinde }: { cobranca: Cobranca; itens: string; corre: boolean; quando: string; brinde: string }) {
  const [pago, setPago] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (pago) return;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/corrida-bambu/pix?id=${encodeURIComponent(cobranca.paymentId)}`);
        const data = await response.json();
        if (data.pago) setPago(true);
      } catch {
        // tenta de novo no próximo ciclo
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [pago, cobranca.paymentId]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(cobranca.copiaECola ?? "");
      setCopiado(true);
    } catch {
      // sem permissão: o código continua visível para copiar na mão
    }
  }

  const titulo = corre ? "Tá inscrito!" : "Pedido feito!";

  if (pago) {
    return (
      <div className={`${CAIXA} p-6 text-center`}>
        <CheckCircle2 className="mx-auto h-12 w-12" />
        <p className="mt-3 font-heading text-3xl font-bold uppercase">Pagamento recebido!</p>
        <p className="mt-2 text-lg">
          Camisetas garantidas: {itens}. Retira no dia, {quando}, e cada uma vale {brinde}.
        </p>
      </div>
    );
  }

  if (cobranca.forma === "cartao") {
    return (
      <div className={`${CAIXA} p-6 text-center`}>
        <p className="font-heading text-3xl font-bold uppercase">{titulo}</p>
        <p className="mt-2 text-lg">
          Falta pagar <strong>R$ {cobranca.total}</strong> no cartão, em 1x. Camisetas: {itens}.
        </p>
        <a href={cobranca.invoiceUrl} target="_blank" rel="noopener noreferrer" className={`${BOTAO} mt-5`}>
          Pagar com cartão
        </a>
        <p className="mt-4 text-sm">Abre a página segura do Asaas. Depois volta aqui: a tela atualiza sozinha.</p>
      </div>
    );
  }

  return (
    <div className={`${CAIXA} p-6 text-center`}>
      <p className="font-heading text-3xl font-bold uppercase">{titulo}</p>
      <p className="mt-2 text-lg">
        Falta o Pix de <strong>R$ {cobranca.total}</strong>. Camisetas: {itens}.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/png;base64,${cobranca.qrCodeImage}`} alt="QR Code Pix das camisetas" className="mx-auto mt-5 h-56 w-56 rounded-xl border-2 border-[#09300b] bg-white p-2" />
      <div className="mt-5 break-all rounded-xl bg-white p-3 text-left text-xs">{cobranca.copiaECola}</div>
      <button type="button" onClick={copiar} className={`${BOTAO} mt-4`}>
        {copiado ? "Copiado!" : "Copiar código Pix"}
      </button>
      <p className="mt-4 text-sm">A tela atualiza sozinha quando o Pix cair.</p>
    </div>
  );
}
