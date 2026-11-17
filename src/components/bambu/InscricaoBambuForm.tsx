"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

const CAMPO =
  "h-14 rounded-xl border-2 border-[#09300b] bg-white px-4 text-lg text-[#09300b] outline-none focus:shadow-[3px_3px_0_#09300b]";
const OPCAO =
  "flex h-14 items-center justify-center rounded-xl border-2 border-[#09300b] px-3 font-heading text-lg font-bold uppercase text-[#09300b] transition-transform active:translate-x-[2px] active:translate-y-[2px] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#09300b]";
const OPCAO_ON = "bg-[#09300b] text-[#f0c94c] shadow-none";
const OPCAO_OFF = "bg-white shadow-[3px_3px_0_#09300b]";
const BOTAO =
  "inline-flex h-16 w-full items-center justify-center gap-3 rounded-2xl border-2 border-[#09300b] bg-[#f0c94c] px-6 font-heading text-xl font-bold uppercase text-[#09300b] shadow-[4px_4px_0_#09300b] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#09300b]";
const CAIXA = "rounded-3xl border-2 border-[#09300b] bg-[#fdf3c4] p-5 text-[#09300b] shadow-[6px_6px_0_#09300b]";

const TAMANHOS = ["P", "M", "G", "GG"] as const;
type Forma = "pix" | "cartao";
type Cobranca = { forma: Forma; paymentId: string; invoiceUrl: string; qrCodeImage?: string; copiaECola?: string };

type Props = {
  quando: string;
  /** null = camiseta não está à venda agora. */
  camiseta: { valor: number; pedidoAte: string } | null;
};

export function InscricaoBambuForm({ quando, camiseta }: Props) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [querCamiseta, setQuerCamiseta] = useState(false);
  const [tamanho, setTamanho] = useState<string>("");
  const [forma, setForma] = useState<Forma>("pix");
  const [cpf, setCpf] = useState("");
  const [site, setSite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [cobranca, setCobranca] = useState<Cobranca | null>(null);
  const [error, setError] = useState("");

  const comCamiseta = Boolean(camiseta && querCamiseta);

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (comCamiseta && !tamanho) {
      setError("Escolhe o tamanho da camiseta.");
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
          camiseta: comCamiseta ? tamanho : undefined,
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
    return <PagarCamiseta cobranca={cobranca} valor={camiseta.valor} tamanho={tamanho} quando={quando} />;
  }

  if (status === "done") {
    return (
      <div className={`${CAIXA} p-6 text-center`}>
        <CheckCircle2 className="mx-auto h-12 w-12" />
        <p className="mt-3 font-heading text-3xl font-bold uppercase">Tá dentro!</p>
        <p className="mt-2 text-lg">{quando}. Vem de tênis e com fôlego pra festa depois.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className={`grid gap-5 ${CAIXA}`}>
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

      {camiseta ? (
        <fieldset className="grid gap-3">
          <legend className="mb-2 font-heading text-xl font-semibold">Camiseta da corrida</legend>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" aria-pressed={!querCamiseta} onClick={() => setQuerCamiseta(false)} className={`${OPCAO} ${!querCamiseta ? OPCAO_ON : OPCAO_OFF}`}>
              Só correr
            </button>
            <button type="button" aria-pressed={querCamiseta} onClick={() => setQuerCamiseta(true)} className={`${OPCAO} ${querCamiseta ? OPCAO_ON : OPCAO_OFF}`}>
              + Camiseta
            </button>
          </div>
          {querCamiseta ? (
            <>
              <p className="text-base">
                <strong>R$ {camiseta.valor}</strong>, no Pix ou no cartão (1x). Pedido até {camiseta.pedidoAte}. Retira no dia da corrida.
              </p>
              <div className="grid grid-cols-4 gap-2" role="group" aria-label="Tamanho">
                {TAMANHOS.map((t) => (
                  <button key={t} type="button" aria-pressed={tamanho === t} onClick={() => setTamanho(t)} className={`${OPCAO} ${tamanho === t ? OPCAO_ON : OPCAO_OFF}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3" role="group" aria-label="Pagamento">
                {(["pix", "cartao"] as const).map((f) => (
                  <button key={f} type="button" aria-pressed={forma === f} onClick={() => setForma(f)} className={`${OPCAO} ${forma === f ? OPCAO_ON : OPCAO_OFF}`}>
                    {f === "pix" ? "Pix" : "Cartão 1x"}
                  </button>
                ))}
              </div>
              <label className="grid gap-2">
                <span className="font-heading text-xl font-semibold">CPF</span>
                <input
                  required
                  name="cpf"
                  inputMode="numeric"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className={CAMPO}
                  placeholder="Só pra gerar a cobrança"
                />
              </label>
            </>
          ) : null}
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
        {comCamiseta ? (forma === "pix" ? "Correr e gerar Pix" : "Correr e pagar") : "Quero correr"}
      </button>
    </form>
  );
}

function PagarCamiseta({ cobranca, valor, tamanho, quando }: { cobranca: Cobranca; valor: number; tamanho: string; quando: string }) {
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

  if (pago) {
    return (
      <div className={`${CAIXA} p-6 text-center`}>
        <CheckCircle2 className="mx-auto h-12 w-12" />
        <p className="mt-3 font-heading text-3xl font-bold uppercase">Pagamento recebido!</p>
        <p className="mt-2 text-lg">
          Camiseta {tamanho} garantida. {quando}: corre com ela.
        </p>
      </div>
    );
  }

  if (cobranca.forma === "cartao") {
    return (
      <div className={`${CAIXA} p-6 text-center`}>
        <p className="font-heading text-3xl font-bold uppercase">Tá inscrito!</p>
        <p className="mt-2 text-lg">
          Falta pagar <strong>R$ {valor}</strong> da camiseta {tamanho} no cartão, em 1x.
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
      <p className="font-heading text-3xl font-bold uppercase">Tá inscrito!</p>
      <p className="mt-2 text-lg">
        Falta o Pix de <strong>R$ {valor}</strong> da camiseta {tamanho}.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/png;base64,${cobranca.qrCodeImage}`} alt="QR Code Pix da camiseta" className="mx-auto mt-5 h-56 w-56 rounded-xl border-2 border-[#09300b] bg-white p-2" />
      <div className="mt-5 break-all rounded-xl bg-white p-3 text-left text-xs">{cobranca.copiaECola}</div>
      <button type="button" onClick={copiar} className={`${BOTAO} mt-4`}>
        {copiado ? "Copiado!" : "Copiar código Pix"}
      </button>
      <p className="mt-4 text-sm">A tela atualiza sozinha quando o Pix cair.</p>
    </div>
  );
}
