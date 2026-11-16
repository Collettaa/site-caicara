"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

const CAMPO =
  "h-14 rounded-xl border-2 border-[#09300b] bg-white px-4 text-lg text-[#09300b] outline-none focus:shadow-[3px_3px_0_#09300b]";

export function InscricaoBambuForm({ quando }: { quando: string }) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [site, setSite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("sending");
    try {
      const response = await fetch("/api/corrida-bambu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, whatsapp, site }),
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
      <div className="rounded-3xl border-2 border-[#09300b] bg-[#fdf3c4] p-6 text-center text-[#09300b] shadow-[6px_6px_0_#09300b]">
        <CheckCircle2 className="mx-auto h-12 w-12" />
        <p className="mt-3 font-heading text-3xl font-bold uppercase">Tá dentro!</p>
        <p className="mt-2 text-lg">{quando}. Vem de tênis e com fôlego pra festa depois.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="grid gap-5 rounded-3xl border-2 border-[#09300b] bg-[#fdf3c4] p-5 shadow-[6px_6px_0_#09300b]">
      <label className="grid gap-2">
        <span className="font-heading text-xl font-semibold text-[#09300b]">Nome</span>
        <input required name="nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} className={CAMPO} placeholder="Seu nome" />
      </label>
      <label className="grid gap-2">
        <span className="font-heading text-xl font-semibold text-[#09300b]">WhatsApp</span>
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
      <input type="text" name="site" tabIndex={-1} autoComplete="off" value={site} onChange={(e) => setSite(e.target.value)} className="hidden" aria-hidden="true" />
      {error ? (
        <p role="alert" className="rounded-xl border-2 border-red-700 bg-red-50 px-4 py-3 font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex h-16 items-center justify-center gap-3 rounded-2xl border-2 border-[#09300b] bg-[#f0c94c] px-6 font-heading text-xl font-bold uppercase text-[#09300b] shadow-[4px_4px_0_#09300b] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#09300b]"
      >
        {status === "sending" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Quero correr
      </button>
    </form>
  );
}
