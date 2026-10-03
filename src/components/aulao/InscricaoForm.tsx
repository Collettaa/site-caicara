"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";

type Vinculo = "aluno" | "totalpass" | "avulsa";

type Pix = {
  paymentId: string;
  qrCodeImage: string;
  copiaECola: string;
  invoiceUrl: string;
};

const optionClass = (active: boolean) =>
  `flex-1 rounded-2xl border px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] transition-colors ${
    active ? "border-black bg-black text-white" : "border-zinc-300 bg-white text-zinc-800 hover:border-black"
  }`;

export function InscricaoForm({ pixAtivo }: { pixAtivo: boolean }) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [ehAluno, setEhAluno] = useState<boolean | null>(null);
  const [comoVem, setComoVem] = useState<"totalpass" | "avulsa" | null>(null);
  const [cpf, setCpf] = useState("");
  const [site, setSite] = useState("");
  const [pix, setPix] = useState<Pix | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const vinculo: Vinculo | null = ehAluno === true ? "aluno" : ehAluno === false ? comoVem : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!vinculo) {
      setError(ehAluno === false ? "Escolhe se vem pela TotalPass ou avulsa." : "Diz se você é aluno Caiçara.");
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/aulao-rosa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, whatsapp, vinculo, cpf, site }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Não deu pra enviar. Tenta de novo.");
        setStatus("idle");
        return;
      }
      setPix(data.pix ?? null);
      setStatus("done");
    } catch {
      setError("Sem conexão. Tenta de novo.");
      setStatus("idle");
    }
  }

  if (status === "done" && pix) {
    return <PixPayment pix={pix} />;
  }

  if (status === "done") {
    return (
      <div className="rounded-[2rem] border border-pink-200 bg-pink-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-pink-500" />
        <h3 className="mt-4 font-heading text-3xl font-black uppercase tracking-tight">Inscrição feita!</h3>
        <p className="mt-3 text-lg text-zinc-700">
          Te esperamos domingo, 18/10, às 9h. Vem de rosa e chega uns 10 minutos antes.
        </p>
        {vinculo === "avulsa" ? (
          <p className="mt-3 text-zinc-600">A aula avulsa (R$ 15) você acerta no box, no dia.</p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5 sm:p-8"
    >
      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">Nome</span>
          <input
            required
            name="nome"
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="h-14 rounded-2xl border border-zinc-300 px-4 text-lg outline-none focus:border-black"
            placeholder="Seu nome"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">WhatsApp</span>
          <input
            required
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="h-14 rounded-2xl border border-zinc-300 px-4 text-lg outline-none focus:border-black"
            placeholder="(13) 99999-9999"
          />
        </label>

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Você é aluno Caiçara?
          </legend>
          <div className="flex gap-3">
            <button type="button" className={optionClass(ehAluno === true)} onClick={() => setEhAluno(true)}>
              Sim
            </button>
            <button type="button" className={optionClass(ehAluno === false)} onClick={() => setEhAluno(false)}>
              Não
            </button>
          </div>
        </fieldset>

        {ehAluno === false ? (
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Como você vem?
            </legend>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className={optionClass(comoVem === "totalpass")}
                onClick={() => setComoVem("totalpass")}
              >
                Pela TotalPass
              </button>
              <button type="button" className={optionClass(comoVem === "avulsa")} onClick={() => setComoVem("avulsa")}>
                Avulsa
              </button>
            </div>
            {comoVem === "avulsa" && pixAtivo ? (
              <label className="mt-3 grid gap-2">
                <span className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">CPF</span>
                <input
                  required
                  name="cpf"
                  inputMode="numeric"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="h-14 rounded-2xl border border-zinc-300 px-4 text-lg outline-none focus:border-black"
                  placeholder="000.000.000-00"
                />
                <span className="text-sm text-zinc-500">
                  Aula avulsa: <strong>R$ 15 no Pix</strong>. O CPF é só para gerar a cobrança.
                </span>
              </label>
            ) : null}
          </fieldset>
        ) : null}

        <input
          type="text"
          name="site"
          tabIndex={-1}
          autoComplete="off"
          value={site}
          onChange={(e) => setSite(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />

        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-pink-500 px-8 text-sm font-bold uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {status === "sending" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {comoVem === "avulsa" && ehAluno === false && pixAtivo ? "Inscrever e gerar Pix" : "Confirmar inscrição"}
        </button>
      </div>
    </form>
  );
}

function PixPayment({ pix }: { pix: Pix }) {
  const [pago, setPago] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (pago) return;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/aulao-rosa/pix?id=${encodeURIComponent(pix.paymentId)}`);
        const data = await response.json();
        if (data.pago) setPago(true);
      } catch {
        // tenta de novo no próximo ciclo
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [pago, pix.paymentId]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pix.copiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // navegador sem permissão: o código continua visível pra copiar na mão
    }
  }

  if (pago) {
    return (
      <div className="rounded-[2rem] border border-pink-200 bg-pink-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-pink-500" />
        <h3 className="mt-4 font-heading text-3xl font-black uppercase tracking-tight">Pix recebido!</h3>
        <p className="mt-3 text-lg text-zinc-700">
          Tá tudo certo. Te esperamos domingo, 18/10, às 9h. Vem de rosa e chega uns 10 minutos antes.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 text-center shadow-xl shadow-zinc-950/5 sm:p-8">
      <span className="inline-flex rounded-full bg-pink-100 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-pink-600">
        Inscrição feita
      </span>
      <h3 className="mt-4 font-heading text-3xl font-black uppercase tracking-tight">Falta o Pix de R$ 15</h3>
      <p className="mt-2 text-zinc-600">Aponta a câmera do app do banco ou usa o copia e cola.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/png;base64,${pix.qrCodeImage}`}
        alt="QR Code Pix do Aulão Rosa"
        className="mx-auto mt-6 h-56 w-56 rounded-2xl border border-zinc-200"
      />
      <div className="mt-6 break-all rounded-2xl bg-zinc-50 p-4 text-left text-xs text-zinc-600">{pix.copiaECola}</div>
      <button
        type="button"
        onClick={copiar}
        className="mt-4 inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-pink-500 px-8 text-sm font-bold uppercase tracking-[0.14em] text-white"
      >
        <Copy className="h-5 w-5" />
        {copiado ? "Copiado!" : "Copiar código Pix"}
      </button>
      <p className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Esperando o pagamento. Esta tela atualiza sozinha.
      </p>
      <a
        href={pix.invoiceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-sm font-semibold text-zinc-700 underline"
      >
        Abrir a cobrança em outra página
      </a>
    </div>
  );
}
