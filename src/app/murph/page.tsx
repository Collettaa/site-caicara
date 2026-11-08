import type { Metadata } from "next";
import Image from "next/image";
import { CalendarDays, Clock, MapPin, Shirt } from "lucide-react";
import { InscricaoMurphForm } from "@/components/murph/InscricaoMurphForm";
import { bateriaLabel, baterias, bateriasLivres, listInscricoes, murph } from "@/lib/murph";
import fotoTreino from "../../../public/images/open-1.jpeg";

// Vagas por bateria mudam a cada inscrição.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Murph | Inscrição",
  description:
    "Murph na Caiçara Fit em São Vicente: sexta, 04/12, em 6 baterias ao longo do dia. Completo, em dupla ou meio Murph. Escolha sua bateria e faça a inscrição.",
  alternates: { canonical: "/murph" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/murph",
    title: "Murph · Caiçara Fit",
    description: "Sexta, 04/12. Escolhe a bateria: 6h, 8h, 12h, 16h, 18h30 ou 20h.",
    images: [{ url: "/images/open-1.jpeg", width: 1080, height: 1620, alt: "Aluna da Caiçara Fit no meio do treino" }],
  },
};

const treino = ["1,6 km de corrida", "100 barras", "200 flexões", "300 agachamentos", "1,6 km de corrida"];

const quemEntra = (comPreco: { fora?: number; camiseta?: number }) => [
  { titulo: "Aluno Caiçara", texto: "Grátis. Só escolhe a bateria." },
  { titulo: "TotalPass", texto: "Grátis. Só escolhe a bateria e faz o check-in no dia." },
  {
    titulo: "De fora",
    texto: comPreco.fora
      ? `Inscrição de R$ ${comPreco.fora}. Quem leva a camiseta já está inscrito.`
      : "Quem leva a camiseta já está inscrito. Sem camiseta, a inscrição a gente acerta no WhatsApp.",
  },
];

export default async function MurphPage() {
  const livres = bateriasLivres(await listInscricoes());

  return (
    <>
      <section className="relative overflow-hidden bg-zinc-950 pt-16 text-white sm:pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(248,216,8,0.22),_transparent_45%)]" />
        <div className="container relative z-10 grid items-end gap-6 px-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="pb-12 pt-2 lg:pb-24">
            <span className="inline-flex rounded-full border border-caicara-yellow/40 bg-caicara-yellow/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-caicara-yellow">
              Fim de ano · Caiçara Fit
            </span>
            <h1 className="mt-6 font-heading text-7xl font-black uppercase leading-[0.9] tracking-tight sm:text-9xl">
              Murph
            </h1>
            <p className="mt-6 inline-flex -rotate-1 bg-caicara-yellow px-4 py-2 font-heading text-xl font-black uppercase text-black sm:text-2xl">
              6 baterias no mesmo dia
            </p>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
              O treino mais famoso do mundo funcional, com a galera do box do lado. Completo, em dupla ou meio Murph:
              escolhe o seu e a sua bateria.
            </p>
            <div className="mt-8 flex flex-col gap-3 text-zinc-200 sm:flex-row sm:flex-wrap sm:gap-x-8">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-caicara-yellow" />
                {murph.dateLabel}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-5 w-5 text-caicara-yellow" />
                {baterias.map(bateriaLabel).join(" · ")}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-5 w-5 text-caicara-yellow" />
                {murph.location}
              </span>
            </div>
            <a
              href="#inscricao"
              className="mt-10 inline-flex h-14 items-center justify-center rounded-full bg-caicara-yellow px-8 text-sm font-bold uppercase tracking-[0.14em] text-black transition-transform hover:-translate-y-0.5"
            >
              {murph.inscricoesAbertas ? "Quero me inscrever" : "Inscrições encerradas"}
            </a>
          </div>
          <div className="relative order-first mx-auto aspect-[4/5] w-full max-w-[260px] overflow-hidden rounded-t-[2rem] sm:max-w-sm lg:order-none lg:max-w-md">
            <Image
              src={fotoTreino}
              alt="Aluna da Caiçara Fit suada, no meio do treino"
              priority
              fill
              sizes="(max-width: 1024px) 384px, 448px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-white py-16 text-black sm:py-24">
        <div className="container grid gap-10 px-4 lg:grid-cols-2">
          <div>
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">O treino</span>
            <h2 className="mt-4 font-heading text-4xl font-black uppercase tracking-tight sm:text-5xl">Murph completo</h2>
            <ol className="mt-6 grid gap-2">
              {treino.map((item, n) => (
                <li key={n} className="flex items-center gap-4 rounded-2xl bg-zinc-50 px-5 py-4 font-heading text-xl font-black uppercase">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-sm text-caicara-yellow">
                    {n + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
          <div className="grid content-start gap-3">
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Do seu jeito</span>
            <div className="rounded-2xl border border-zinc-200 p-5">
              <p className="font-heading text-xl font-black uppercase">Em dupla</p>
              <p className="text-zinc-600">Mesmo treino, repetições divididas com alguém.</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 p-5">
              <p className="font-heading text-xl font-black uppercase">Meio Murph</p>
              <p className="text-zinc-600">Metade de tudo. Bom pra quem vai fazer o primeiro.</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 p-5">
              <p className="flex items-center gap-2 font-heading text-xl font-black uppercase">
                <Shirt className="h-5 w-5" /> Camiseta do Murph
              </p>
              <p className="text-zinc-600">
                Opcional{murph.camisetaValor ? `, R$ ${murph.camisetaValor}` : ""}. Quem leva a camiseta já está inscrito.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="inscricao" className="scroll-mt-24 bg-zinc-50 py-16 text-black sm:py-24">
        <div className="container grid gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h2 className="font-heading text-3xl font-black uppercase tracking-tight sm:text-5xl">
              {murph.inscricoesAbertas ? "Garanta sua bateria" : "Lista fechada"}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600">
              Até {murph.vagasPorBateria} pessoas por bateria. Bateria lotada sai da lista.
            </p>
            <div className="mt-8 grid gap-3">
              {quemEntra({ fora: murph.inscricaoForaValor, camiseta: murph.camisetaValor }).map((item) => (
                <div key={item.titulo} className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <p className="font-heading text-lg font-black uppercase">{item.titulo}</p>
                  <p className="text-zinc-600">{item.texto}</p>
                </div>
              ))}
            </div>
          </div>
          {murph.inscricoesAbertas ? (
            <InscricaoMurphForm livresIniciais={livres} whatsappFinal={murph.whatsappFinal} dateLabel={murph.dateLabel} />
          ) : (
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-8 sm:p-10">
              <p className="font-heading text-3xl font-black uppercase tracking-tight sm:text-4xl">Inscrições encerradas</p>
              <p className="mt-4 text-lg leading-relaxed text-zinc-700">
                Valeu, galera! Quem se inscreveu: {murph.dateLabel.toLowerCase()}, na bateria escolhida.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
