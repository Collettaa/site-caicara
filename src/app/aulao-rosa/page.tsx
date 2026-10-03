import type { Metadata } from "next";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import { InscricaoForm } from "@/components/aulao/InscricaoForm";
import { aulaoRosa } from "@/lib/aulao-rosa";

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
  },
};

const checklist = [
  "Vem de rosa: qualquer peça vale (camiseta, top, meia, laço, tênis).",
  "Chega uns 10 minutos antes.",
  "Cada um no seu ritmo: a prof. adapta.",
  "Traz alguém que você quer ver se cuidando.",
];

export default function AulaoRosaPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-zinc-950 pt-28 pb-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.28),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(255,193,7,0.14),_transparent_35%)]" />
        <div className="container relative z-10 px-4">
          <span className="inline-flex rounded-full border border-pink-400/40 bg-pink-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">
            Outubro Rosa
          </span>
          <h1 className="mt-6 max-w-4xl font-heading text-5xl font-black uppercase tracking-tight sm:text-7xl">
            <span className="text-pink-400">{aulaoRosa.title}</span> na Caiçara
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
            Um convite pra se mexer junto e cuidar de você, com a {aulaoRosa.teacher}. Vem de rosa e traz alguém.
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
      </section>

      <section id="inscricao" className="scroll-mt-24 bg-zinc-50 py-16 text-black sm:py-24">
        <div className="container grid gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h2 className="font-heading text-3xl font-black uppercase tracking-tight sm:text-5xl">
              Garanta seu lugar
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600">
              Leva menos de um minuto. A gente confirma pelo WhatsApp.
            </p>
            <ul className="mt-8 grid gap-3">
              {checklist.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-700"
                >
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-pink-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <InscricaoForm />
        </div>
      </section>
    </>
  );
}
