import type { Metadata } from "next";
import Image from "next/image";
import { CalendarDays, Heart, MapPin, Sparkles } from "lucide-react";
import { InscricaoForm } from "@/components/aulao/InscricaoForm";
import { asaasEnabled, aulaoRosa } from "@/lib/aulao-rosa";
import mariaRecorte from "../../../public/images/aulao-rosa/maria-recorte.png";
import mariaAula from "../../../public/images/aulao-rosa/maria-aula.jpg";

// Lê no servidor se o Pix do Asaas está configurado.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aulão Rosa | Inscrição",
  description:
    "Aulão Rosa da Caiçara Fit em São Vicente: domingo, 18/10, às 9h, com a prof. Maria. Vem de rosa e traz alguém. Faça sua inscrição.",
  alternates: {
    canonical: "/aulao-rosa",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/aulao-rosa",
    title: "Aulão Rosa · Caiçara Fit",
    description: "Domingo, 18/10, às 9h, com a prof. Maria. Vem de rosa e traz alguém.",
    images: [{ url: "/images/aulao-rosa/maria-aula.jpg", width: 696, height: 870, alt: "Prof. Maria dando aula" }],
  },
};

const checklist = [
  "Vem de rosa: qualquer peça vale (camiseta, top, meia, laço, tênis).",
  "Chega uns 10 minutos antes.",
  "Cada um no seu ritmo: a prof. adapta.",
  "Traz alguém que você quer ver se cuidando.",
];

const comoEntrar = (pixAtivo: boolean) => [
  { titulo: "Aluno Caiçara", texto: "Já está dentro. Só se inscreve pra gente saber que você vem." },
  { titulo: "TotalPass", texto: "Faz o check-in normal no app no dia da aula." },
  {
    titulo: "Avulsa",
    texto: pixAtivo
      ? `R$ ${aulaoRosa.avulsaValor} no Pix, pago aqui mesmo na inscrição.`
      : `R$ ${aulaoRosa.avulsaValor}, pago no box no dia.`,
  },
];

export default function AulaoRosaPage() {
  const pixAtivo = asaasEnabled();

  return (
    <>
      <section className="relative overflow-hidden bg-zinc-950 pt-16 text-white sm:pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.32),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(255,193,7,0.16),_transparent_35%)]" />
        <div className="container relative z-10 grid items-end gap-6 px-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="pb-12 pt-2 lg:pb-24">
            <span className="inline-flex rounded-full border border-pink-400/40 bg-pink-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">
              Outubro Rosa · Caiçara Fit
            </span>
            <h1 className="mt-6 font-heading text-6xl font-black uppercase leading-[0.9] tracking-tight sm:text-8xl">
              <span className="text-pink-400">Aulão</span>
              <br />
              Rosa
            </h1>
            <p className="mt-6 inline-flex -rotate-1 bg-caicara-yellow px-4 py-2 font-heading text-xl font-black uppercase text-black sm:text-2xl">
              com a prof. Maria
            </p>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
              Um convite pra se mexer junto e cuidar de você. Vem de rosa e traz alguém.
            </p>
            <div className="mt-8 flex flex-col gap-3 text-zinc-200 sm:flex-row sm:gap-8">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-pink-400" />
                {aulaoRosa.dateLabel}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-5 w-5 text-pink-400" />
                {aulaoRosa.location}
              </span>
            </div>
            <a
              href="#inscricao"
              className="mt-10 inline-flex h-14 items-center justify-center rounded-full bg-pink-500 px-8 text-sm font-bold uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5"
            >
              Quero me inscrever
            </a>
          </div>
          <div className="relative order-first mx-auto w-full max-w-[240px] sm:max-w-sm lg:order-none lg:max-w-md">
            <div className="absolute inset-x-6 bottom-0 top-16 rounded-t-full bg-pink-500" />
            <Image
              src={mariaRecorte}
              alt="Prof. Maria, de camiseta rosa, sorrindo com as mãos na cintura"
              priority
              sizes="(max-width: 1024px) 384px, 448px"
              className="relative h-auto w-full"
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-16 text-black sm:py-24">
        <div className="container grid items-center gap-10 px-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-zinc-100">
            <Image
              src={mariaAula}
              alt="Prof. Maria explicando o treino para a turma"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
          <div>
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-pink-500">Quem comanda</span>
            <h2 className="mt-4 font-heading text-4xl font-black uppercase tracking-tight sm:text-5xl">
              Prof. Maria
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-zinc-700">
              A Maria puxa o Aulão Rosa: um treino pra fazer junto, com a turma e muita energia. Nunca treinou?
              Sem problema. Ela adapta cada movimento pro seu ritmo, e ninguém fica pra trás.
            </p>
            <p className="mt-4 flex items-start gap-3 text-lg leading-relaxed text-zinc-700">
              <Heart className="mt-1 h-5 w-5 shrink-0 text-pink-500" />
              Outubro Rosa é sobre se cuidar e cuidar de quem a gente ama. Movimento é um jeito de fazer isso junto.
            </p>
          </div>
        </div>
      </section>

      <section id="inscricao" className="scroll-mt-24 bg-zinc-50 py-16 text-black sm:py-24">
        <div className="container grid gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h2 className="font-heading text-3xl font-black uppercase tracking-tight sm:text-5xl">
              Garanta seu lugar
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600">Leva menos de um minuto.</p>
            <div className="mt-8 grid gap-3">
              {comoEntrar(pixAtivo).map((item) => (
                <div key={item.titulo} className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <p className="font-heading text-lg font-black uppercase">{item.titulo}</p>
                  <p className="text-zinc-600">{item.texto}</p>
                </div>
              ))}
            </div>
            <ul className="mt-8 grid gap-3">
              {checklist.map((item) => (
                <li key={item} className="flex items-start gap-3 text-zinc-700">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-pink-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <InscricaoForm pixAtivo={pixAtivo} />
        </div>
      </section>
    </>
  );
}
