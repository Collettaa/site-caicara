"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";

type Dia = { data: string; rotulo: string; horarios: string[] };

const BOX = "5513920013547";
const chip = (ativo: boolean) =>
  `rounded-2xl border px-3 py-3 text-sm font-bold uppercase tracking-[0.06em] transition-colors ${
    ativo ? "border-black bg-black text-white" : "border-zinc-300 bg-white text-zinc-800 hover:border-black"
  }`;

export function PasseForm({ dias, tranquilas }: { dias: Dia[]; tranquilas: string[] }) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [data, setData] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [site, setSite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [erro, setErro] = useState("");

  const dia = dias.find((d) => d.data === data) ?? null;

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    if (!data || !hora) {
      setErro("Escolhe o dia e o horário da 1ª aula.");
      return;
    }
    setStatus("sending");
    try {
      const r = await fetch("/api/passe-treinao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, whatsapp, data, hora, site }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(j.error ?? "Não deu pra enviar. Tenta de novo.");
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setErro("Sem conexão. Tenta de novo.");
      setStatus("idle");
    }
  }

  if (status === "done" && dia && hora) {
    const texto = `Oii! Marquei minha 1ª aula pelo Passe do Treinão: ${dia.rotulo} às ${hora}. Sou ${nome.split(" ")[0]} 🌴`;
    return (
      <div className="rounded-[2rem] border border-yellow-300 bg-yellow-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-black" />
        <h3 className="mt-4 font-heading text-3xl font-black uppercase tracking-tight">Aula marcada!</h3>
        <p className="mt-3 text-lg text-zinc-800">
          <b>
            {dia.rotulo} às {hora}
          </b>
          . Vem de roupa confortável, tênis e garrafinha de água.
        </p>
        <p className="mt-2 text-zinc-600">Chega uns 10 minutos antes. Na véspera a gente te chama no WhatsApp.</p>
        <a
          href={`https://wa.me/${BOX}?text=${encodeURIComponent(texto)}`}
          className="mt-6 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-bold uppercase tracking-[0.12em] text-white"
        >
          <MessageCircle className="h-5 w-5" /> Avisar no WhatsApp do box
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5 sm:p-8">
      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">Nome</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="name"
            required
            className="h-14 rounded-2xl border border-zinc-300 px-4 text-lg outline-none focus:border-black"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">WhatsApp com DDD</span>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="(13) 9...."
            required
            className="h-14 rounded-2xl border border-zinc-300 px-4 text-lg outline-none focus:border-black"
          />
        </label>
        <input value={site} onChange={(e) => setSite(e.target.value)} name="site" tabIndex={-1} autoComplete="off" className="hidden" />

        <fieldset>
          <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">Dia da 1ª aula</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {dias.map((d) => (
              <button
                type="button"
                key={d.data}
                onClick={() => {
                  setData(d.data);
                  setHora(null);
                }}
                className={chip(d.data === data)}
              >
                {d.rotulo}
              </button>
            ))}
          </div>
        </fieldset>

        {dia ? (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">Horário</legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {dia.horarios.map((h) => (
                <button type="button" key={h} onClick={() => setHora(h)} className={chip(h === hora)}>
                  {h}
                  {tranquilas.includes(h) ? <span className="block text-[10px] font-semibold normal-case opacity-70">mais tranquila</span> : null}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {erro ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{erro}</p> : null}

        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex h-16 items-center justify-center gap-2 rounded-full bg-caicara-yellow px-6 text-base font-black uppercase tracking-[0.12em] text-black disabled:opacity-60"
        >
          {status === "sending" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          Marcar minha aula
        </button>
      </div>
    </form>
  );
}
