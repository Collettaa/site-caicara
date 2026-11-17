import type { Metadata } from "next";
import Image from "next/image";
import { InscricaoBambuForm } from "@/components/bambu/InscricaoBambuForm";
import { camisetaAberta, corridaBambu } from "@/lib/corrida-bambu";
import fotoCamiseta from "../../../public/images/bambu/camiseta.jpg";
import logoBambu from "../../../public/images/bambu/logo-bambu-gastro.png";
import fotoNoite from "../../../public/images/bambu/noite.jpg";
import logoCaicara from "../../../public/images/logo.png";

// A venda da camiseta depende do preço, do Pix e da data: confere a cada visita.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Corrida de inauguração do Bambu Gastro Bar | Inscrição grátis",
  description:
    "Corrida leve de inauguração do Bambu Gastro Bar com a Caiçara Fit: sexta, 27/11, às 20h, no Itararé, em São Vicente. Grátis, é só se inscrever.",
  alternates: { canonical: "/bambu" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/bambu",
    title: "Corrida de inauguração do Bambu Gastro Bar",
    description: "Sexta, 27/11, 20h, no Itararé. Grátis. Corre com a Caiçara Fit e fica pra festa.",
    images: [{ url: "/images/bambu/noite.jpg", width: 1200, height: 1600, alt: "Bambu lotado à noite, de frente pro mar" }],
  },
};

// Cores do Bambu Gastro Bar: verde-mata #09300b (fundo do logo), amarelo do bambu #f0c94c,
// verde-folha #8dbb55, creme #fdf3c4. A pulseira de evento é o elemento que marca a página.
const PULSEIRA = ["Grátis", "Sexta 27/11", "20h", "Itararé"];

export default function BambuPage() {
  const { dateLabel, hora, local, percurso } = corridaBambu;
  const quando = `${dateLabel}, às ${hora}`;
  const { valor, pedidoAteLabel } = corridaBambu.camiseta;
  const vendendo = camisetaAberta() && valor !== null;

  return (
    <div className="overflow-x-clip bg-[#09300b] text-[#fdf3c4]">
      {/* Abertura: o logo do bar manda, o nome do evento vem logo abaixo. */}
      <section className="px-4 pb-14 pt-24 sm:pt-28">
        <div className="mx-auto max-w-2xl">
          <Image src={logoBambu} alt="Bambu Gastro Bar" priority className="mx-auto h-auto w-full max-w-[420px]" />
          <h1 className="mt-10 font-heading text-5xl font-bold uppercase leading-[0.95] sm:text-7xl">
            Corrida de
            <br />
            inauguração
          </h1>
          <p className="mt-4 font-heading text-3xl font-semibold text-[#f0c94c]">{quando}</p>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-[#fdf3c4]/85">
            Uma corrida leve pra abrir a unidade nova do Bambu Gastro Bar, no Itararé. Cada um no seu ritmo. Depois,
            a festa continua lá.
          </p>
          <a
            href="#inscricao"
            className="mt-8 inline-flex h-16 w-full items-center justify-center rounded-2xl border-2 border-[#fdf3c4] bg-[#f0c94c] px-8 font-heading text-xl font-bold uppercase text-[#09300b] shadow-[4px_4px_0_#fdf3c4] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#f0c94c] sm:w-auto"
          >
            Quero correr
          </a>
        </div>
      </section>

      {/* A pulseira do evento atravessando a tela. */}
      <div aria-hidden className="relative -mx-6 -rotate-3 py-2">
        <div className="flex items-center gap-6 whitespace-nowrap border-y-4 border-[#09300b] bg-[#f0c94c] py-4 pl-10 font-heading text-2xl font-bold uppercase text-[#09300b] shadow-[0_6px_0_rgba(0,0,0,0.25)] sm:text-3xl">
          <span className="h-7 w-7 shrink-0 rounded-full border-4 border-[#09300b] bg-[#fdf3c4]" />
          {[...PULSEIRA, ...PULSEIRA, ...PULSEIRA].map((t, i) => (
            <span key={i} className="flex items-center gap-6">
              {t}
              <span className="text-[#8dbb55]">✦</span>
            </span>
          ))}
        </div>
      </div>
      <p className="sr-only">Grátis, sexta 27/11, às 20h, no Itararé.</p>

      {/* O que a pessoa precisa saber. */}
      <section className="px-4 pb-14 pt-16">
        <div className="mx-auto grid max-w-2xl gap-10 sm:grid-cols-[1fr_1fr] sm:items-start">
          <dl className="divide-y divide-[#fdf3c4]/15 border-y border-[#fdf3c4]/15">
            <Linha nome="Quando" valor={quando} />
            <Linha nome="Quanto" valor="Grátis" />
            <Linha nome="Ritmo" valor="O seu" />
            {local ? <Linha nome="Onde" valor={local} /> : null}
            {percurso ? <Linha nome="Percurso" valor={percurso} /> : null}
          </dl>
          <figure>
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] border-4 border-[#f0c94c]">
              <Image
                src={fotoNoite}
                alt="Bambu lotado à noite, de frente pro mar"
                fill
                sizes="(max-width: 640px) 100vw, 336px"
                className="object-cover object-[50%_70%]"
              />
            </div>
            <figcaption className="mt-3 font-[family-name:var(--font-marker)] text-xl text-[#8dbb55]">
              depois da corrida, a festa é no Bambu
            </figcaption>
          </figure>
        </div>
      </section>

      {/* A camiseta do evento. */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-heading text-4xl font-bold uppercase leading-none">Tem camiseta</h2>
          <p className="mt-3 max-w-md text-lg text-[#fdf3c4]/85">
            Branca, com o Bambu na frente e a orla de São Vicente embaixo. P, M, G e GG, pedido até {pedidoAteLabel}.
          </p>
          <div className="relative mt-6 overflow-hidden rounded-3xl border-4 border-[#f0c94c]">
            <Image src={fotoCamiseta} alt="Camiseta da corrida, frente e costas" sizes="(max-width: 672px) 100vw, 672px" className="h-auto w-full" />
          </div>
          <p className="mt-4 font-heading text-2xl font-semibold text-[#f0c94c]">
            {vendendo ? `R$ ${valor} no Pix. Pede junto com a inscrição.` : "Venda abre em breve, aqui nesta página."}
          </p>
        </div>
      </section>

      {/* Inscrição. */}
      <section id="inscricao" className="scroll-mt-20 bg-[#8dbb55] px-4 py-14 text-[#09300b]">
        <div className="mx-auto max-w-xl">
          <h2 className="font-heading text-4xl font-bold uppercase">Inscrição</h2>
          <p className="mt-2 text-lg">{vendendo ? "Nome e WhatsApp. A camiseta é opcional." : "Nome e WhatsApp. Só isso."}</p>
          <div className="mt-6">
            {corridaBambu.inscricoesAbertas ? (
              <InscricaoBambuForm quando={quando} camiseta={vendendo ? { valor, pedidoAte: pedidoAteLabel } : null} />
            ) : (
              <p className="rounded-3xl border-2 border-[#09300b] bg-[#fdf3c4] p-6 font-heading text-2xl font-bold uppercase">
                Inscrições encerradas
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Quem faz. */}
      <section className="px-4 py-10">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-6">
          <Image src={logoCaicara} alt="Caiçara Fit" className="h-14 w-auto" />
          <span className="font-[family-name:var(--font-marker)] text-2xl text-[#8dbb55]">+</span>
          <Image src={logoBambu} alt="Bambu Gastro Bar" className="h-14 w-auto" />
        </div>
      </section>
    </div>
  );
}

function Linha({ nome, valor }: { nome: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-4">
      <dt className="font-heading text-xl">{nome}</dt>
      <dd className="text-right font-heading text-xl font-semibold text-[#f0c94c]">{valor}</dd>
    </div>
  );
}
