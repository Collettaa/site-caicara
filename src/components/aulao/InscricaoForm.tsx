"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

type Vinculo = "aluno" | "totalpass" | "avulsa";

const optionClass = (active: boolean) =>
  `flex-1 rounded-2xl border px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] transition-colors ${
    active ? "border-black bg-black text-white" : "border-zinc-300 bg-white text-zinc-800 hover:border-black"
  }`;

export function InscricaoForm() {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [ehAluno, setEhAluno] = useState<boolean | null>(null);
  const [comoVem, setComoVem] = useState<"totalpass" | "avulsa" | null>(null);
  const [site, setSite] = useState("");
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
        body: JSON.stringify({ nome, whatsapp, vinculo, site }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Não deu pra enviar. Tenta de novo.");
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setError("Sem conexão. Tenta de novo.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-[2rem] border border-pink-200 bg-pink-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-pink-500" />
        <h3 className="mt-4 font-heading text-3xl font-black uppercase tracking-tight">Inscrição feita!</h3>
        <p className="mt-3 text-lg text-zinc-700">
          Te esperamos domingo, 18/10, às 9h. Vem de rosa e chega uns 10 minutos antes.
        </p>
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
            {comoVem === "avulsa" ? (
              <p className="text-sm text-zinc-500">A aula avulsa é paga na hora, no box.</p>
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
          Confirmar inscrição
        </button>
      </div>
    </form>
  );
}
