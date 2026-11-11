"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Loader2, MessageCircle } from "lucide-react";
import type { Bateria, Tamanho, Versao, Vinculo } from "@/lib/murph";

const VINCULOS: { valor: Vinculo; label: string }[] = [
  { valor: "aluno", label: "Aluno Caiçara" },
  { valor: "totalpass", label: "TotalPass" },
  { valor: "fora", label: "De fora" },
];

const VERSOES: { valor: Versao; label: string; texto: string }[] = [
  { valor: "completo", label: "Completo", texto: "1,6 km + 100 pull-ups + 200 push-ups + 300 air squats + 1,6 km" },
  { valor: "dupla", label: "Em dupla", texto: "Mesmo treino, repetições divididas com alguém" },
  { valor: "meio", label: "Meio Murph", texto: "Metade de tudo" },
];

const TAMANHOS: Tamanho[] = ["P", "M", "G", "GG"];

const rotulo = (b: Bateria) => b.replace(/^0/, "").replace(":00", "h").replace(":", "h");

// Opção escolhida fica preta com texto amarelo e "afunda" (perde a sombra): dá pra ver de longe o que marcou.
const optionClass = (active: boolean) =>
  `min-h-14 rounded-xl border-2 border-black px-4 py-3 font-heading text-lg font-semibold transition-[transform,box-shadow] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-caicara-yellow ${
    active
      ? "translate-x-[3px] translate-y-[3px] bg-black text-caicara-yellow shadow-none"
      : "bg-white text-black shadow-[3px_3px_0_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
  }`;

const legenda = "mb-3 font-heading text-xl font-semibold text-black";

const CARTAO = "rounded-3xl border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000] sm:p-8";

// Botão grande com sombra preta dura; ao tocar, afunda.
const BOTAO =
  "inline-flex h-16 items-center justify-center gap-3 rounded-2xl border-2 border-black px-6 font-heading text-xl font-bold uppercase shadow-[4px_4px_0_#000] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black";

const campoClass =
  "h-14 rounded-xl border-2 border-black bg-white px-4 text-lg outline-none focus:shadow-[3px_3px_0_#000] focus-visible:ring-0";

type Pix = { paymentId: string; qrCodeImage: string; copiaECola: string; invoiceUrl: string };

export function InscricaoMurphForm({
  livresIniciais,
  whatsappFinal,
  dateLabel,
  pixAtivo,
  valorFora,
}: {
  livresIniciais: Bateria[];
  whatsappFinal: string;
  dateLabel: string;
  pixAtivo: boolean;
  valorFora: number;
}) {
  const [cpf, setCpf] = useState("");
  const [pix, setPix] = useState<Pix | null>(null);
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

  // De fora sem camiseta paga a participação no Pix. Com camiseta, a participação vem junto.
  const pagaPix = pixAtivo && vinculo === "fora" && camiseta === false;

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
        body: JSON.stringify({
          nome,
          whatsapp,
          vinculo,
          bateria,
          versao,
          camiseta,
          tamanho: camiseta ? tamanho : undefined,
          cpf: pagaPix ? cpf : undefined,
          site,
        }),
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
      setPix(data.pix ?? null);
      setStatus("done");
    } catch {
      setError("Sem conexão. Tenta de novo.");
      setStatus("idle");
    }
  }

  if (status === "done" && bateria && pix) {
    return <PixPagamento pix={pix} valor={valorFora} whatsappFinal={whatsappFinal} quando={`${dateLabel}, bateria das ${rotulo(bateria)}`} />;
  }

  if (status === "done" && bateria) {
    return (
      <div className={`${CARTAO} text-center`}>
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
          className={`${BOTAO} mt-6 w-full bg-[#25D366] text-black`}
        >
          <MessageCircle className="h-5 w-5" />
          Mandar MURPH
        </a>
      </div>
    );
  }

  if (livres.length === 0) {
    return (
      <div className={CARTAO}>
        <p className="font-heading text-3xl font-black uppercase tracking-tight sm:text-4xl">Baterias lotadas</p>
        <p className="mt-4 text-lg leading-relaxed text-zinc-700">
          As 6 baterias encheram. Chama a gente no WhatsApp que, se abrir vaga, você é o primeiro a saber.
        </p>
      </div>
    );
  }

  const opcao = (ativo: boolean, onClick: () => void, children: React.ReactNode, extra = "") => (
    <button type="button" aria-pressed={ativo} className={`${optionClass(ativo)} ${extra}`} onClick={onClick}>
      {children}
    </button>
  );
  const rotuloCampo = "font-heading text-xl font-semibold text-black";

  return (
    <form onSubmit={handleSubmit} className={CARTAO}>
      <div className="grid gap-8">
        <label className="grid gap-2">
          <span className={rotuloCampo}>Nome</span>
          <input required name="nome" autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} className={campoClass} placeholder="Seu nome" />
        </label>

        <label className="grid gap-2">
          <span className={rotuloCampo}>WhatsApp</span>
          <input
            required
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className={campoClass}
            placeholder="(13) 99999-9999"
          />
        </label>

        <fieldset>
          <legend className={legenda}>Você é</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {VINCULOS.map((v) => (
              <span key={v.valor} className="contents">
                {opcao(vinculo === v.valor, () => setVinculo(v.valor), v.label)}
              </span>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={legenda}>Bateria</legend>
          <div className="grid grid-cols-3 gap-3">
            {livres.map((b) => (
              <span key={b} className="contents">
                {opcao(bateria === b, () => setBateria(b), rotulo(b), "text-2xl")}
              </span>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={legenda}>Versão</legend>
          <div className="grid gap-3">
            {VERSOES.map((v) => (
              <span key={v.valor} className="contents">
                {opcao(
                  versao === v.valor,
                  () => setVersao(v.valor),
                  <>
                    {v.label}
                    <span className={`mt-0.5 block font-sans text-sm font-normal ${versao === v.valor ? "text-zinc-300" : "text-zinc-600"}`}>
                      {v.texto}
                    </span>
                  </>,
                  "text-left",
                )}
              </span>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={legenda}>Quer a camiseta do Murph?</legend>
          <div className="grid grid-cols-2 gap-3">
            {opcao(camiseta === true, () => setCamiseta(true), "Sim")}
            {opcao(camiseta === false, () => setCamiseta(false), "Não")}
          </div>
          {camiseta ? (
            <div className="mt-5">
              <p className={legenda}>Tamanho</p>
              <div className="grid grid-cols-4 gap-3">
                {TAMANHOS.map((t) => (
                  <span key={t} className="contents">
                    {opcao(tamanho === t, () => setTamanho(t), t)}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-zinc-600">Com a camiseta você já está inscrito. O pagamento a gente acerta no WhatsApp.</p>
            </div>
          ) : null}
          {pagaPix ? (
            <label className="mt-5 grid gap-2">
              <span className={rotuloCampo}>CPF</span>
              <input
                name="cpf"
                inputMode="numeric"
                autoComplete="off"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className={campoClass}
                placeholder="000.000.000-00"
              />
              <span className="text-zinc-600">
                De fora e sem camiseta: <strong className="text-black">R$ {valorFora} no Pix</strong> para participar. O CPF é só para gerar a cobrança.
              </span>
            </label>
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

        {error ? (
          <p role="alert" className="rounded-xl border-2 border-red-600 bg-red-50 px-4 py-3 font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={status === "sending"} className={`${BOTAO} bg-caicara-yellow text-black`}>
          {status === "sending" ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {pagaPix ? "Inscrever e gerar Pix" : "Confirmar inscrição"}
        </button>
      </div>
    </form>
  );
}

function PixPagamento({ pix, valor, whatsappFinal, quando }: { pix: Pix; valor: number; whatsappFinal: string; quando: string }) {
  const [pago, setPago] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (pago) return;
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/murph/pix?id=${encodeURIComponent(pix.paymentId)}`);
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
      // sem permissão: o código continua visível para copiar na mão
    }
  }

  if (pago) {
    return (
      <div className={`${CARTAO} text-center`}>
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h3 className="mt-4 font-heading text-3xl font-black uppercase tracking-tight">Pix recebido!</h3>
        <p className="mt-3 text-lg text-zinc-700">Tá inscrito: {quando}. Chega um pouco antes pra aquecer.</p>
        <p className="mt-3 text-zinc-600">
          Manda <strong>MURPH</strong> no WhatsApp do box pra gente confirmar tua vaga.
        </p>
        <a
          href={whatsappFinal}
          target="_blank"
          rel="noopener noreferrer"
          className={`${BOTAO} mt-6 w-full bg-[#25D366] text-black`}
        >
          <MessageCircle className="h-5 w-5" />
          Mandar MURPH
        </a>
      </div>
    );
  }

  return (
    <div className={`${CARTAO} text-center`}>
      <span className="inline-flex rounded-full border-2 border-black bg-caicara-yellow px-4 py-1 font-heading text-base font-semibold text-black">
        Inscrição feita
      </span>
      <h3 className="mt-4 font-heading text-3xl font-black uppercase tracking-tight">Falta o Pix de R$ {valor}</h3>
      <p className="mt-2 text-zinc-600">Aponta a câmera do app do banco ou usa o copia e cola.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/png;base64,${pix.qrCodeImage}`}
        alt="QR Code Pix do Murph"
        className="mx-auto mt-6 h-56 w-56 rounded-2xl border border-zinc-200"
      />
      <div className="mt-6 break-all rounded-2xl bg-zinc-50 p-4 text-left text-xs text-zinc-600">{pix.copiaECola}</div>
      <button
        type="button"
        onClick={copiar}
        className={`${BOTAO} mt-4 w-full bg-black text-white`}
      >
        <Copy className="h-5 w-5" />
        {copiado ? "Copiado!" : "Copiar código Pix"}
      </button>
      <p className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Esperando o pagamento. Esta tela atualiza sozinha.
      </p>
      <a href={pix.invoiceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-sm font-semibold text-zinc-700 underline">
        Abrir a cobrança em outra página
      </a>
    </div>
  );
}
