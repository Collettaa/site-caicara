import type { Metadata } from "next";
import Image from "next/image";
import { CalendarDays, MapPin } from "lucide-react";
import { PasseForm } from "@/components/passe/PasseForm";
import { diasDisponiveis, passeTreinao, TRANQUILAS } from "@/lib/passe-treinao";
import foto from "../../../public/images/community.jpg";

// Dias de amanhã até 07/12: calcula a cada acesso.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Passe do Treinão | 1 semana grátis",
  description: "Você fez o Treinão do Bambu. Agora vem treinar com a gente: 1 semana grátis na Caiçara Fit, em São Vicente.",
  alternates: { canonical: "/passe" },
  robots: { index: false, follow: false },
};

const passos = [
  { n: "1", t: "Marca o dia", d: "Escolhe o dia e o horário da sua 1ª aula no formulário." },
  { n: "2", t: "Vem treinar", d: "Roupa confortável, tênis e garrafinha de água. O coach adapta tudo pro seu ritmo." },
  { n: "3", t: "Uma semana inteira", d: "Treina a semana toda sem pagar nada e vê se é a sua." },
];

export default function PassePage() {
  const dias = diasDisponiveis(new Date());
  const aberto = dias.length > 0;

  return (
    <>
      <section className="relative overflow-hidden bg-zinc-950 pt-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,193,7,0.28),_transparent_45%)]" />
        <div className="container relative z-10 grid items-center gap-8 px-4 pb-8 lg:grid-cols-[1.1fr_0.9fr] lg:pb-20">
          <div>
            <span className="inline-flex rounded-full border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300">
              {passeTreinao.title}
            </span>
            <h1 className="mt-6 font-heading text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl">
              Você fez o treinão.
              <br />
              <span className="text-caicara-yellow">Agora vem treinar com a gente.</span>
            </h1>
            <p className="mt-6 inline-flex -rotate-1 bg-caicara-yellow px-4 py-2 font-heading text-2xl font-black uppercase text-black">
              1 semana grátis
            </p>
            <div className="mt-8 flex flex-col gap-3 text-zinc-200">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-caicara-yellow" />
                Começa até {passeTreinao.comecarAteLabel}
              </span>
              <a href={passeTreinao.mapa} className="inline-flex items-center gap-2 underline-offset-4 hover:underline">
                <MapPin className="h-5 w-5 text-caicara-yellow" />
                {passeTreinao.endereco}
              </a>
            </div>
          </div>
          <div className="relative mx-auto hidden aspect-[4/3] w-full max-w-md overflow-hidden rounded-[2rem] lg:block">
            <Image src={foto} alt="Turma da Caiçara Fit treinando junto" fill priority sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="bg-white py-12 text-black sm:py-16">
        <div className="container grid gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-heading text-3xl font-black uppercase tracking-tight sm:text-4xl">Como funciona</h2>
            <ol className="mt-6 grid gap-4">
              {passos.map((p) => (
                <li key={p.n} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-caicara-yellow font-heading text-xl font-black">
                    {p.n}
                  </span>
                  <div>
                    <p className="font-bold uppercase">{p.t}</p>
                    <p className="text-zinc-600">{p.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-zinc-500">Nunca treinou? Sem problema. As turmas das 7h e das 9h são as mais tranquilas.</p>
          </div>
          <div id="marcar" className="order-first lg:order-none">
            {aberto ? (
              <PasseForm dias={dias} tranquilas={[...TRANQUILAS]} />
            ) : (
              <div className="rounded-[2rem] border border-zinc-200 p-8 text-center">
                <p className="font-heading text-2xl font-black uppercase">O passe do treinão acabou</p>
                <p className="mt-2 text-zinc-600">Mas a semana grátis continua: chama a gente no WhatsApp.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
