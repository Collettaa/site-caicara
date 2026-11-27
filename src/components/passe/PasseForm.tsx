"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, MessageCircle } from "lucide-react";

type Dia = { data: string; rotulo: string; horarios: string[] };

const BOX = "5513920013547";
const SEMANA: Record<string, string> = { seg: "segunda", ter: "terça", qua: "quarta", qui: "quinta", sex: "sexta" };
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "ter 01/12" → { curto: "ter", longo: "terça", dia: "01", mes: "dez" } */
function partes(rotulo: string) {
  const [curto, dm] = rotulo.split(" ");
  const [dia, mes] = dm.split("/");
  return { curto, longo: SEMANA[curto] ?? curto, dia, mes: MESES[Number(mes) - 1] };
}

const minutos = (h: string) => {
  const [hh, mm] = h.split("h");
  return Number(hh) * 60 + Number(mm || 0);
};
const PERIODOS = [
  { nome: "Manhã", de: 0, ate: 12 * 60 },
  { nome: "Tarde", de: 12 * 60, ate: 18 * 60 },
  { nome: "Noite", de: 18 * 60, ate: 24 * 60 },
];

export function PasseForm({ dias, tranquilas, comecarAte }: { dias: Dia[]; tranquilas: string[]; comecarAte: string }) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [data, setData] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [site, setSite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [erro, setErro] = useState("");
  const horasRef = useRef<HTMLFieldSetElement>(null);
  const dadosRef = useRef<HTMLDivElement>(null);

  const dia = dias.find((d) => d.data === data) ?? null;
  const p = dia ? partes(dia.rotulo) : null;

  // Escolheu o dia → desce para os horários; escolheu o horário → desce para nome e WhatsApp.
  useEffect(() => {
    if (data) horasRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [data]);
  useEffect(() => {
    if (hora) dadosRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [hora]);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    if (!data || !hora) {
      setErro("Falta escolher o dia e o horário da 1ª aula.");
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
        setErro(j.error ?? "Não deu pra marcar. Confere os dados e tenta de novo.");
        setStatus("idle");
        return;
      }
      setStatus("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErro("Sem internet agora. Tenta de novo em instantes.");
      setStatus("idle");
    }
  }

  const feito = status === "done";
  const zap = dia && hora ? `Oii! Marquei minha 1ª aula pelo Passe do Treinão: ${dia.rotulo} às ${hora}. Sou ${nome.trim().split(" ")[0]} 🌴` : "";

  return (
    <div className="mx-auto w-full max-w-md">
      {/* O passe: se preenche enquanto a pessoa escolhe */}
      <div className={`passe relative text-[#111111] ${feito ? "passe-ok" : ""}`}>
        <div className="rounded-t-[1.25rem] bg-[#F8D808] px-6 pb-5 pt-5">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Passe do Treinão</span>
            <span className="opacity-70">Caiçara Fit</span>
          </div>
          <p className="mt-3 font-heading text-[4.2rem] font-black uppercase leading-[0.82] tracking-tight">
            1 semana
            <br />
            grátis
          </p>
          <p className="mt-3 text-sm font-medium">Você fez o treinão. Agora vem treinar com a gente.</p>
        </div>
        <div className="picote relative h-0 border-t-2 border-dashed border-[#111111]/40" aria-hidden />
        <div className="rounded-b-[1.25rem] bg-[#F8D808] px-6 pb-5 pt-4">
          <div className="grid grid-cols-[1fr_auto] items-end gap-4">
            <div>
              <p className="text-xs font-semibold opacity-70">Sua 1ª aula</p>
              {p && hora ? (
                <p key={`${data}${hora}`} className="preenche font-heading text-3xl font-black uppercase leading-none">
                  {p.curto} {p.dia} {p.mes} · {hora}
                </p>
              ) : p ? (
                <p key={data!} className="preenche font-heading text-3xl font-black uppercase leading-none">
                  {p.curto} {p.dia} {p.mes} · <span className="opacity-40">__h</span>
                </p>
              ) : (
                <p className="font-heading text-3xl font-black uppercase leading-none opacity-35">escolhe abaixo</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold opacity-70">Começa até</p>
              <p className="font-heading text-xl font-black leading-none">{comecarAte}</p>
            </div>
          </div>
          {feito ? (
            <p className="carimbo mt-4 inline-flex items-center gap-2 rounded-full bg-[#111111] px-4 py-2 text-sm font-bold text-[#F8D808]">
              <Check className="h-4 w-4" /> Aula marcada
            </p>
          ) : null}
        </div>
      </div>

      {feito && dia && hora ? (
        <div className="mt-8 grid gap-4 text-white">
          <p className="text-lg leading-relaxed">
            Te esperamos {p?.longo} às {hora}. Vem de roupa confortável, tênis e garrafinha de água, e chega uns 10 minutos antes.
          </p>
          <p className="text-[#9A9A9A]">Na véspera a gente te chama no WhatsApp para confirmar.</p>
          <a
            href={`https://wa.me/${BOX}?text=${encodeURIComponent(zap)}`}
            className="mt-2 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#F8D808] px-6 font-bold text-[#111111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F8D808]"
          >
            <MessageCircle className="h-5 w-5" /> Avisar no WhatsApp do box
          </a>
        </div>
      ) : (
        <form onSubmit={enviar} className="mt-10 grid gap-9 text-white" noValidate>
          <fieldset>
            <legend className="font-heading text-2xl font-black uppercase">1. Qual dia?</legend>
            <div className="-mx-4 mt-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
              {dias.map((d) => {
                const q = partes(d.rotulo);
                const ativo = d.data === data;
                return (
                  <button
                    type="button"
                    key={d.data}
                    aria-pressed={ativo}
                    onClick={() => {
                      setData(d.data);
                      setHora(null);
                    }}
                    className={`flex w-[4.4rem] shrink-0 snap-start flex-col items-center rounded-2xl border-2 py-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F8D808] ${
                      ativo ? "border-[#F8D808] bg-[#F8D808] text-[#111111]" : "border-[#2A2A2A] bg-[#1B1B1B] text-white hover:border-[#9A9A9A]"
                    }`}
                  >
                    <span className="text-xs font-semibold">{q.curto}</span>
                    <span className="font-heading text-3xl font-black leading-none">{q.dia}</span>
                    <span className="text-xs">{q.mes}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset ref={horasRef} disabled={!dia} className={dia ? "" : "opacity-40"}>
            <legend className="font-heading text-2xl font-black uppercase">2. Que horas?</legend>
            {!dia ? <p className="mt-2 text-sm text-[#9A9A9A]">Escolhe o dia primeiro.</p> : null}
            {dia
              ? PERIODOS.map((per) => {
                  const hs = dia.horarios.filter((h) => minutos(h) >= per.de && minutos(h) < per.ate);
                  if (!hs.length) return null;
                  return (
                    <div key={per.nome} className="mt-4">
                      <p className="text-sm text-[#9A9A9A]">{per.nome}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {hs.map((h) => {
                          const ativo = h === hora;
                          return (
                            <button
                              type="button"
                              key={h}
                              aria-pressed={ativo}
                              onClick={() => setHora(h)}
                              className={`relative h-12 min-w-[4.5rem] rounded-full border-2 px-4 font-heading text-xl font-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F8D808] ${
                                ativo ? "border-[#F8D808] bg-[#F8D808] text-[#111111]" : "border-[#2A2A2A] bg-[#1B1B1B] text-white hover:border-[#9A9A9A]"
                              }`}
                            >
                              {h}
                              {tranquilas.includes(h) ? (
                                <span className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#111111] ${ativo ? "bg-white" : "bg-[#F8D808]"}`} />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              : null}
            {dia ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-[#9A9A9A]">
                <span className="h-3 w-3 rounded-full bg-[#F8D808]" /> Turma mais tranquila, boa para quem está começando
              </p>
            ) : null}
          </fieldset>

          <div ref={dadosRef} className="grid gap-4">
            <p className="font-heading text-2xl font-black uppercase">3. Quem vem?</p>
            <label className="grid gap-2">
              <span className="text-sm text-[#9A9A9A]">Seu nome</span>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="name"
                required
                className="h-14 rounded-2xl border-2 border-[#2A2A2A] bg-[#1B1B1B] px-4 text-lg text-white outline-none focus:border-[#F8D808]"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm text-[#9A9A9A]">WhatsApp com DDD</span>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="(13) 9 0000-0000"
                required
                className="h-14 rounded-2xl border-2 border-[#2A2A2A] bg-[#1B1B1B] px-4 text-lg text-white outline-none placeholder:text-[#5A5A5A] focus:border-[#F8D808]"
              />
            </label>
            <input value={site} onChange={(e) => setSite(e.target.value)} name="site" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          </div>

          {erro ? (
            <p role="alert" className="rounded-2xl border-2 border-[#F8D808] p-4 text-sm font-semibold text-[#F8D808]">
              {erro}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex min-h-16 items-center justify-center gap-2 rounded-full bg-[#F8D808] px-6 py-4 text-lg font-bold text-[#111111] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F8D808]"
          >
            {status === "sending" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {dia && hora && p ? `Marcar ${p.curto} ${p.dia} às ${hora}` : "Marcar minha aula"}
          </button>
        </form>
      )}

      <style>{`
        .passe .picote::before, .passe .picote::after {
          content: ""; position: absolute; top: -13px; width: 24px; height: 24px; border-radius: 9999px; background: #111111;
        }
        .passe .picote::before { left: -12px; }
        .passe .picote::after { right: -12px; }
        .passe .picote { margin: 0; background: #F8D808; }
        .passe > div:first-child, .passe > div:last-child { box-shadow: 0 0 0 0 transparent; }
        @keyframes preenche { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes carimbo { 0% { opacity: 0; transform: scale(1.6) rotate(-8deg); } 70% { transform: scale(.95) rotate(-3deg); } 100% { opacity: 1; transform: rotate(-3deg); } }
        .preenche { animation: preenche .28s ease-out; }
        .carimbo { animation: carimbo .45s ease-out forwards; }
        @media (prefers-reduced-motion: reduce) { .preenche, .carimbo { animation: none; } }
      `}</style>
    </div>
  );
}
