import type { Metadata } from "next";
import Image from "next/image";
import { InscricaoBambuForm } from "@/components/bambu/InscricaoBambuForm";
import { corridaBambu } from "@/lib/corrida-bambu";
import logoBambu from "../../../public/images/bambu/logo-bambu.png";
import fotoNoite from "../../../public/images/bambu/noite.jpg";
import logoCaicara from "../../../public/images/logo.png";

export const metadata: Metadata = {
  title: "Corrida no Bambu | Inscrição grátis",
  description:
    "Corrida leve de inauguração do Bambu Bar com a Caiçara Fit: sexta, 27/11, às 20h. Grátis, é só se inscrever. Depois, festa.",
  alternates: { canonical: "/bambu" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/bambu",
    title: "Corrida de inauguração do Bambu Bar",
    description: "Sexta, 27/11, 20h. Grátis. Corre com a Caiçara Fit e fica pra festa.",
    images: [{ url: "/images/bambu/noite.jpg", width: 1200, height: 1600, alt: "Bambu Bar lotado à noite, de frente pro mar" }],
  },
};

// Cores do Bambu: verde-mata #19350f do logo, amarelo do bambu #f2c94c, verde-folha #8dbb55.

export default function BambuPage() {
  const { dateLabel, hora, local, percurso } = corridaBambu;
  const quando = `${dateLabel}, às ${hora}`;

  return (
    <div className="bg-[#19350f] text-[#fdf3c4]">
      {/* Abertura: foto do bar à noite, logo do Bambu e a chamada. */}
      <section className="pt-16 sm:pt-20">
        <div className="relative mx-auto max-w-3xl">
          <div className="relative aspect-[4/5] w-full sm:aspect-[16/11]">
            <Image
              src={fotoNoite}
              alt="Bambu Bar lotado à noite, de frente pro mar"
              priority
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover object-[50%_65%]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#19350f]/40 via-transparent to-[#19350f]" />
            <div className="absolute inset-x-0 top-6 flex justify-center px-10">
              <Image src={logoBambu} alt="Bambu Bar" className="h-auto w-full max-w-[320px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
            </div>
          </div>
          <div className="relative -mt-28 px-4 pb-12">
            <p className="font-[family-name:var(--font-marker)] text-2xl text-[#8dbb55]">inauguração com corrida</p>
            <h1 className="mt-1 font-heading text-6xl font-bold uppercase leading-[0.9] sm:text-8xl">
              Corre no
              <br />
              Bambu
            </h1>
            <p className="mt-5 font-heading text-3xl font-semibold text-[#f2c94c]">{quando}</p>
            <p className="mt-3 max-w-md text-lg leading-relaxed text-[#fdf3c4]/85">
              Uma corrida leve, sem pressa e sem cronômetro, pra abrir a festa de inauguração do Bambu. Grátis, é só se
              inscrever.
            </p>
            <a
              href="#inscricao"
              className="mt-8 inline-flex h-16 w-full items-center justify-center rounded-2xl border-2 border-[#fdf3c4] bg-[#f2c94c] px-6 font-heading text-xl font-bold uppercase text-[#19350f] shadow-[4px_4px_0_#fdf3c4] transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none sm:w-auto"
            >
              Quero correr
            </a>
          </div>
        </div>
      </section>

      {/* O que é, em três linhas que respondem o que a pessoa quer saber. */}
      <section className="px-4 pb-14">
        <dl className="mx-auto grid max-w-3xl divide-y divide-[#fdf3c4]/15 border-y border-[#fdf3c4]/15">
          <div className="flex items-baseline justify-between gap-4 py-4">
            <dt className="font-heading text-xl">Quando</dt>
            <dd className="text-right font-heading text-xl font-semibold text-[#f2c94c]">{quando}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-4">
            <dt className="font-heading text-xl">Quanto</dt>
            <dd className="text-right font-heading text-xl font-semibold text-[#f2c94c]">Grátis</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-4">
            <dt className="font-heading text-xl">Ritmo</dt>
            <dd className="text-right font-heading text-xl font-semibold text-[#f2c94c]">O seu</dd>
          </div>
          {local ? (
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="font-heading text-xl">Onde</dt>
              <dd className="text-right font-heading text-xl font-semibold text-[#f2c94c]">{local}</dd>
            </div>
          ) : null}
          {percurso ? (
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="font-heading text-xl">Percurso</dt>
              <dd className="text-right font-heading text-xl font-semibold text-[#f2c94c]">{percurso}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {/* Inscrição. */}
      <section id="inscricao" className="scroll-mt-20 bg-[#8dbb55] px-4 py-14 text-[#19350f]">
        <div className="mx-auto max-w-xl">
          <h2 className="font-heading text-4xl font-bold uppercase">Inscrição</h2>
          <p className="mt-2 text-lg">Nome e WhatsApp. Só isso.</p>
          <div className="mt-6">
            {corridaBambu.inscricoesAbertas ? (
              <InscricaoBambuForm quando={quando} />
            ) : (
              <p className="rounded-3xl border-2 border-[#19350f] bg-[#fdf3c4] p-6 font-heading text-2xl font-bold uppercase">
                Inscrições encerradas
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Quem faz. */}
      <section className="px-4 py-10">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-6">
          <Image src={logoCaicara} alt="Caiçara Fit" className="h-14 w-auto" />
          <span className="font-[family-name:var(--font-marker)] text-2xl text-[#8dbb55]">+</span>
          <Image src={logoBambu} alt="Bambu Bar" className="h-12 w-auto" />
        </div>
      </section>
    </div>
  );
}
