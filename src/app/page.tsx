import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Heart,
  MessageCircle,
  Sparkles,
  Users,
  Waves,
} from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { GoogleReviewsSection } from "@/components/home/GoogleReviewsSection";
import { HomeEventsShowcase } from "@/components/home/HomeEventsShowcase";
import { siteConfig } from "@/lib/site";

const heroProofs = [
  {
    value: "1 semana",
    label: "para conhecer sem pressa",
  },
  {
    value: "Box + areia",
    label: "treino, eventos e beach sports",
  },
  {
    value: "São Vicente",
    label: "Baixada santista, São Vicente",
  },
];

const pillars = [
  {
    title: "Acolhimento ativo",
    description:
      "A equipe acompanha de perto, adapta o treino e cria espaço para quem está começando, voltando ou buscando consistência.",
    icon: Heart,
  },
  {
    title: "Evolução possível",
    description: "Força, mobilidade e fôlego aparecem com método, sem transformar cuidado em cobrança vazia ou comparação desnecessária.",
    icon: Dumbbell,
  },
  {
    title: "Vida de litoral",
    description: "Box, praia, encontros e beach sports conectam saúde ao jeito leve de viver São Vicente.",
    icon: Waves,
  },
];

const arrivalSteps = [
  {
    title: "Você conversa com a equipe",
    description:
      "A primeira orientação entende seu momento, seu histórico e o formato de treino que vai funcionar de verdade para você.",
    icon: MessageCircle,
  },
  {
    title: "O treino encontra sua medida",
    description: "Cada aula tem técnica, intensidade ajustável e correções para você sair melhor do que entrou.",
    icon: CheckCircle2,
  },
  {
    title: "A constância ganha companhia",
    description: "Entre box, praia e eventos, o treino deixa de ser obrigação isolada e vira parte natural da semana.",
    icon: Users,
  },
];

const modalities = [
  {
    eyebrow: "Dentro do box",
    title: "Funcional & Cross",
    description:
      "Movimentos precisos, carga adaptada ao seu nível e acompanhamento próximo para construir força de um jeito sustentável.",
    features: ["Força, mobilidade e condicionamento", "Escalas para iniciantes, retorno e evolução"],
    image: "/images/open-1.jpeg",
    alt: "Treino funcional e cross da Caiçara Fit",
  },
  {
    eyebrow: "Na areia",
    title: "Beach sports",
    description: "Futevôlei e beach tennis entram como extensão natural do seu treino: movimento, sol, técnica e convivência.",
    features: ["Futevôlei e beach tennis", "Clima esportivo sem perder leveza"],
    image: "/images/beach-sports-new.jpg",
    alt: "Aulas de beach sports da Caiçara Fit",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative isolate flex min-h-[calc(100svh-5rem)] overflow-hidden bg-zinc-950 pt-28 pb-16 text-white sm:pt-32 lg:items-center">
        <div className="absolute inset-0 -z-10">
          <Image
            src={siteConfig.heroImage}
            alt="Alunos da Caiçara Fit treinando em São Vicente"
            fill
            priority
            sizes="100vw"
            className="scale-[1.02] object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.88)_0%,rgba(9,9,11,0.58)_48%,rgba(9,9,11,0.2)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,193,7,0.08),transparent_28%),linear-gradient(180deg,rgba(9,9,11,0.18),rgba(9,9,11,0.82))]" />
        </div>

        <div className="container px-4">
          <div className="max-w-3xl">
            <FadeIn delay={0.08}>
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-caicara-yellow backdrop-blur-md">
                Conheça nosso espaço em São Vicente
              </span>
            </FadeIn>

            <FadeIn delay={0.16}>
              <h1 className="mt-8 max-w-3xl font-heading text-5xl font-black uppercase leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-8xl">
                Treino forte, rotina leve.
                <span className="block text-caicara-yellow">Jeito caiçara.</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.24}>
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-zinc-200 sm:text-xl">
                Treino funcional, crosstraining e beach sports para quem quer evoluir com orientação de perto, acolhimento real e
                uma comunidade que faz a constância parecer mais natural.
              </p>
            </FadeIn>

            <FadeIn delay={0.32}>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a
                  href={siteConfig.trialWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-14 items-center justify-center rounded-full bg-caicara-yellow px-8 text-sm font-bold uppercase tracking-[0.12em] text-black transition-transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Agendar aula experimental
                  <ArrowRight className="ml-3 h-4 w-4" />
                </a>
                <Link
                  href="/eventos"
                  className="inline-flex h-14 items-center justify-center rounded-full border border-white/20 bg-white/8 px-8 text-sm font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black"
                >
                  Ver eventos
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="mt-12 grid max-w-3xl gap-3 border-t border-white/15 pt-6 text-sm text-zinc-300 sm:grid-cols-3">
                {heroProofs.map((proof) => (
                  <div key={proof.value} className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-caicara-yellow" />
                    <p>
                      <strong className="block text-base font-bold text-white">{proof.value}</strong>
                      <span>{proof.label}</span>
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section id="sobre" className="scroll-mt-32 bg-[#f7f3ea] py-20 text-zinc-950 sm:py-28">
        <div className="container px-4">
          <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
            <FadeIn delay={0.08}>
              <div>
                <span className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Por que a Caiçara
                </span>
                <h2 className="mt-5 max-w-2xl font-heading text-4xl font-black uppercase leading-[0.98] tracking-[-0.035em] sm:text-6xl">
                  Treino com presença, técnica e pertencimento.
                </h2>
              </div>
            </FadeIn>

            <FadeIn delay={0.16}>
              <p className="max-w-2xl text-xl leading-relaxed text-zinc-600">
                Mais do que uma academia em São Vicente, a Caiçara existe para deixar seu treino de cross e funcional mais humano: técnico o suficiente para gerar resultado, sustentável o
                suficiente para se integrar ao seu dia a dia e próximo o bastante para você não atravessar o processo sozinho.
              </p>
            </FadeIn>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;

              return (
                <FadeIn key={pillar.title} delay={0.18 + index * 0.06} direction="up">
                  <article className="h-full rounded-[1.75rem] border border-black/10 bg-white/65 p-7 shadow-sm shadow-zinc-950/5 backdrop-blur">
                    <Icon className="h-7 w-7 text-caicara-yellow-dark" />
                    <h3 className="mt-8 font-heading text-2xl font-black uppercase tracking-[-0.02em]">
                      {pillar.title}
                    </h3>
                    <p className="mt-4 leading-relaxed text-zinc-600">{pillar.description}</p>
                  </article>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-zinc-950 py-20 text-white sm:py-28">
        <div className="container px-4">
          <div className="grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <FadeIn delay={0.08} direction="right">
              <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] bg-zinc-900 sm:min-h-[560px]">
                <Image
                  src="/images/women-laughing.jpg"
                  alt="Alunas da Caiçara Fit em momento de convivência depois do treino"
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <p className="max-w-md text-lg font-medium leading-relaxed text-zinc-100">
                    Treinar bem também é encontrar um lugar onde você se reconhece e quer voltar.
                  </p>
                </div>
              </div>
            </FadeIn>

            <div>
              <FadeIn delay={0.12}>
                <span className="text-sm font-semibold uppercase tracking-[0.22em] text-caicara-yellow">
                  Como é chegar
                </span>
                <h2 className="mt-5 font-heading text-4xl font-black uppercase leading-[0.98] tracking-[-0.035em] sm:text-6xl">
                  Sem pressa para provar. Com direção para evoluir.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-300">
                  A primeira semana é para sentir o ambiente da nossa academia, conhecer nossa metodologia de treino funcional e crosstraining e perceber se a energia
                  da Caiçara combina com o que você quer construir.
                </p>
              </FadeIn>

              <div className="mt-10 grid gap-4">
                {arrivalSteps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <FadeIn key={step.title} delay={0.18 + index * 0.06} direction="up">
                      <article className="grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-[2.5rem_1fr]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-caicara-yellow text-black">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-heading text-2xl font-black uppercase tracking-[-0.02em] text-white">
                            {step.title}
                          </h3>
                          <p className="mt-2 leading-relaxed text-zinc-300">{step.description}</p>
                        </div>
                      </article>
                    </FadeIn>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="scroll-mt-32 bg-white py-20 text-zinc-950 sm:py-28">
        <div className="container px-4">
          <div className="grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
            <FadeIn delay={0.08}>
              <div className="lg:sticky lg:top-28">
                <span className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  Modalidades
                </span>
                <h2 className="mt-5 font-heading text-4xl font-black uppercase leading-[0.98] tracking-[-0.035em] sm:text-6xl">
                  Escolha o ritmo. A equipe ajusta o caminho.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-600">
                  O formato ideal nasce entendendo o seu momento. Você traz seu objetivo; a equipe desenha o melhor caminho
                  para uma entrada possível e segura.
                </p>
                <a
                  href={siteConfig.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center rounded-full border border-zinc-950 px-7 py-3 text-sm font-bold uppercase tracking-[0.12em] text-zinc-950 transition-colors hover:bg-zinc-950 hover:text-white"
                >
                  Conversar sobre planos
                  <ArrowRight className="ml-3 h-4 w-4" />
                </a>
              </div>
            </FadeIn>

            <div className="grid gap-5">
              {modalities.map((modality, index) => (
                <FadeIn key={modality.title} delay={0.16 + index * 0.08} direction="up">
                  <article className="group grid overflow-hidden rounded-[2rem] border border-zinc-200 bg-zinc-50 sm:grid-cols-[0.92fr_1.08fr]">
                    <div className="relative min-h-[280px] overflow-hidden bg-zinc-100 sm:min-h-[360px]">
                      <Image
                        src={modality.image}
                        alt={modality.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, 45vw"
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="flex flex-col justify-between p-7 sm:p-9">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-caicara-yellow-dark">
                          {modality.eyebrow}
                        </p>
                        <h3 className="mt-5 font-heading text-3xl font-black uppercase tracking-[-0.025em] sm:text-4xl">
                          {modality.title}
                        </h3>
                        <p className="mt-4 max-w-md text-lg leading-relaxed text-zinc-600">{modality.description}</p>
                        <div className="mt-6 grid gap-3">
                          {modality.features.map((feature) => (
                            <p key={feature} className="inline-flex items-start gap-3 text-sm font-medium text-zinc-700">
                              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-caicara-yellow-dark" />
                              {feature}
                            </p>
                          ))}
                        </div>
                      </div>
                      <a
                        href={siteConfig.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-8 inline-flex w-fit items-center text-sm font-bold uppercase tracking-[0.12em] text-zinc-950 transition-colors hover:text-caicara-yellow-dark"
                      >
                        Saber mais
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </div>
                  </article>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HomeEventsShowcase />
      <GoogleReviewsSection fallbackMapsUrl={siteConfig.googleMapsUrl} reviewUrl={siteConfig.googleReviewUrl} />

      <section className="bg-white py-20 text-zinc-950 sm:py-28">
        <div className="container px-4">
          <FadeIn delay={0.08}>
            <div className="relative overflow-hidden rounded-[2.25rem] bg-zinc-950 px-6 py-14 text-center text-white sm:px-12 sm:py-20">
              <Image
                src="/images/community.jpg"
                alt="Comunidade Caiçara Fit reunida"
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover object-center opacity-35"
              />
              <div className="absolute inset-0 bg-zinc-950/70" />
              <div className="relative mx-auto max-w-3xl">
                <span className="text-sm font-semibold uppercase tracking-[0.22em] text-caicara-yellow">
                  Venha conhecer o espaço
                </span>
                <h2 className="mt-5 font-heading text-4xl font-black uppercase leading-[0.98] tracking-[-0.035em] sm:text-6xl">
                  Venha descobrir como a Caiçara se encaixa na sua vida.
                </h2>
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300">
                  Conheça a nossa academia, faça sua primeira aula de crosstraining ou funcional sem pressão e sinta o clima do box.
                  Se fizer sentido, a gente segue junto.
                </p>
                <a
                  href={siteConfig.trialWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-9 inline-flex h-14 items-center justify-center rounded-full bg-caicara-yellow px-8 text-sm font-bold uppercase tracking-[0.12em] text-black transition-transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Liberar minha aula
                  <ArrowRight className="ml-3 h-4 w-4" />
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
