"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import type { Bateria, Tamanho, Versao, Vinculo } from "@/lib/murph";

const VINCULOS: { valor: Vinculo; label: string }[] = [
  { valor: "aluno", label: "Aluno Caiçara" },
  { valor: "totalpass", label: "TotalPass" },
  { valor: "fora", label: "De fora" },
];

const VERSOES: { valor: Versao; label: string; texto: string }[] = [
  { valor: "completo", label: "Completo", texto: "1,6 km + 100 barras + 200 flexões + 300 agachamentos + 1,6 km" },
  { valor: "dupla", label: "Em dupla", texto: "Mesmo treino, repetições divididas com alguém" },
  { valor: "meio", label: "Meio Murph", texto: "Metade de tudo" },
];

const TAMANHOS: Tamanho[] = ["P", "M", "G", "GG"];

const rotulo = (b: Bateria) => b.replace(/^0/, "").replace(":00", "h").replace(":", "h");

const optionClass = (active: boolean) =>
  `rounded-2xl border px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] transition-colors ${
    active ? "border-black bg-black text-white" : "border-zinc-300 bg-white text-zinc-800 hover:border-black"
  }`;

const legenda = "mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500";

export function InscricaoMurphForm({
  livresIniciais,
  whatsappFinal,
  dateLabel,
}: {
  livresIniciais: Bateria[];
  whatsappFinal: string;
  dateLabel: string;
}) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [vinculo, setVinculo] = useState<Vinculo | null>(null);
  const [bateria, setBateria] = useState<Bateria | null>(null);
  const [versao, setVersao] = useState<Versao | null>(null);
  const [camiseta, setCamiseta] = useState<boolean | null>(null);
  const [tamanho, setTamanho] = useState<Tamanho | null>(null);
  const [livres, setLivres] = useState<Bateria[]>(livresIniciais);
  const [site, setSite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!vinculo) return setError("Diz se você é aluno, TotalPass ou de fora.");
    if (!bateria) return setError("Escolhe a bateria.");
    if (!versao) return setError("Escolhe a versão do Murph.");
    if (camiseta === null) return setError("Diz se quer a camiseta.");
    if (camiseta && !tamanho) return setError("Escolhe o tamanho da camiseta.");

    setStatus("sending");
    try {
      const response = await fetch("/api/murph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, whatsapp, vinculo, bateria, versao, camiseta, tamanho: camiseta ? tamanho : undefined, site }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (Array.isArray(data.livres)) {
          setLivres(data.livres);
          setBateria(null);
        }
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

  if (status === "done" && bateria) {
    return (
      <div className="rounded-[2rem] border border-zinc-200 bg-white p-8 text-center shadow-xl shadow-zinc-950/5">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h3 className="mt-4 font-heading text-3xl font-black uppercase tracking-tight">Tá inscrito!</h3>
        <p className="mt-3 text-lg text-zinc-700">
          {dateLabel}, bateria das <strong>{rotulo(bateria)}</strong>. Chega um pouco antes pra aquecer.
        </p>
        <p className="mt-3 text-zinc-600">
          Agora manda <strong>MURPH</strong> no WhatsApp do box: é por lá que a gente confirma tua vaga
          {vinculo === "fora" || camiseta ? " e acerta inscrição e camiseta" : ""}.
        </p>
        <a
          href={whatsappFinal}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#25D366] px-8 text-sm font-bold uppercase tracking-[0.14em] text-black transition-transform hover:-translate-y-0.5"
        >
          <MessageCircle className="h-5 w-5" />
          Mandar MURPH
        </a>
      </div>
    );
  }

  if (livres.length === 0) {
    return (
      <div className="rounded-[2rem] border border-zinc-200 bg-white p-8 sm:p-10">
        <p className="font-heading text-3xl font-black uppercase tracking-tight sm:text-4xl">Baterias lotadas</p>
        <p className="mt-4 text-lg leading-relaxed text-zinc-700">
          As 6 baterias encheram. Chama a gente no WhatsApp que, se abrir vaga, você é o primeiro a saber.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5 sm:p-8"
    >
      <div className="grid gap-6">
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

        <fieldset>
          <legend className={legenda}>Você é</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {VINCULOS.map((v) => (
              <button key={v.valor} type="button" className={optionClass(vinculo === v.valor)} onClick={() => setVinculo(v.valor)}>
                {v.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={legenda}>Bateria</legend>
          <div className="grid grid-cols-3 gap-3">
            {livres.map((b) => (
              <button key={b} type="button" className={optionClass(bateria === b)} onClick={() => setBateria(b)}>
                {rotulo(b)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={legenda}>Versão</legend>
          <div className="grid gap-3">
            {VERSOES.map((v) => (
              <button
                key={v.valor}
                type="button"
                className={`${optionClass(versao === v.valor)} text-left`}
                onClick={() => setVersao(v.valor)}
              >
                {v.label}
                <span className={`mt-1 block text-xs font-medium normal-case tracking-normal ${versao === v.valor ? "text-zinc-300" : "text-zinc-500"}`}>
                  {v.texto}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={legenda}>Quer a camiseta do Murph?</legend>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className={optionClass(camiseta === true)} onClick={() => setCamiseta(true)}>
              Sim
            </button>
            <button type="button" className={optionClass(camiseta === false)} onClick={() => setCamiseta(false)}>
              Não
            </button>
          </div>
          {camiseta ? (
            <div className="mt-4">
              <p className={legenda}>Tamanho</p>
              <div className="grid grid-cols-4 gap-3">
                {TAMANHOS.map((t) => (
                  <button key={t} type="button" className={optionClass(tamanho === t)} onClick={() => setTamanho(t)}>
                    {t}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-zinc-500">O pagamento a gente acerta com você no WhatsApp.</p>
            </div>
          ) : null}
        </fieldset>

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
          className="inline-flex h-14 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-caicara-yellow px-8 text-sm font-bold uppercase tracking-[0.14em] text-black transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {status === "sending" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          Confirmar inscrição
        </button>
      </div>
    </form>
  );
}
