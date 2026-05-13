import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { events } from "@/content/events";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Eventos e comunidade",
  description:
    "Eventos da Caiçara Fit em São Vicente com crosstraining, beach sports, corrida e experiências que conectam treino, praia e comunidade.",
  keywords: [
    "eventos fitness em São Vicente",
    "crosstraining são vicente",
    "corrida caiçara fit",
    "beach sports são vicente",
  ],
  alternates: {
    canonical: "/eventos",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/eventos",
    title: "Eventos Caiçara Fit em São Vicente",
    description:
      "Recaps reais de encontros que levam a energia da Caiçara Fit da praia ao box.",
    siteName: siteConfig.name,
    images: [
      {
        url: events[0].heroImage,
        width: 1200,
        height: 630,
        alt: "Eventos da Caiçara Fit em São Vicente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventos Caiçara Fit",
    description:
      "Yoga Day, Hyrox Day e ativações de corrida em uma página feita para mostrar o jeito Caiçara de treinar junto.",
    images: [events[0].heroImage],
  },
};

export default function EventosPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-zinc-950 pt-28 pb-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,193,7,0.18),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_32%)]" />
        <div className="container relative z-10 px-4">
          <FadeIn delay={0.05}>
            <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-caicara-yellow">
              Eventos Caiçara
            </span>
          </FadeIn>
          <FadeIn delay={0.12}>
            <div className="mt-6 max-w-5xl">
              <h1 className="text-4xl font-heading font-black uppercase tracking-tight text-white sm:text-6xl">
                Encontros que colocam a <span className="text-caicara-yellow">Caiçara</span> em movimento.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
                Da praia ao box, a Caiçara Fit cria experiências que misturam treino, bem-estar e conexão real entre
                as pessoas. Aqui você vê um pouco do que já rolou e do clima que move a comunidade.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Formato</p>
                <p className="mt-2 text-lg font-bold text-white">Recaps reais de ativações</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Cenário</p>
                <p className="mt-2 text-lg font-bold text-white">Praia, orla, praça e box</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Proposta</p>
                <p className="mt-2 text-lg font-bold text-white">Treino com leveza e presença</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="bg-zinc-50 py-20 text-black sm:py-24">
        <div className="container px-4">
          <div className="space-y-10">
            {events.map((event, index) => (
              <FadeIn key={event.slug} delay={0.1 + index * 0.05}>
                <article
                  id={event.slug}
                  className="scroll-mt-32 overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-xl shadow-zinc-950/5"
                >
                  <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr]">
                    <div className="relative min-h-[340px] overflow-hidden bg-zinc-200 sm:min-h-[460px]">
                      <Image
                        src={event.heroImage}
                        alt={event.title}
                        fill
                        priority={index === 0}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                        <div className="flex flex-col gap-3 text-sm font-medium text-zinc-200 sm:flex-row sm:flex-wrap sm:items-center">
                          <span className="inline-flex rounded-full bg-caicara-yellow px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-black">
                            {event.label}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-caicara-yellow" />
                            {event.dateLabel}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-caicara-yellow" />
                            {event.location}
                          </span>
                        </div>
                        <h2 className="mt-4 text-3xl font-heading font-black uppercase tracking-tight sm:text-5xl">
                          {event.title}
                        </h2>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between p-6 sm:p-8">
                      <div>
                        <p className="text-lg leading-relaxed text-zinc-700">{event.summary}</p>
                        <div className="mt-8 grid gap-3">
                          {event.highlights.map((highlight) => (
                            <div
                              key={highlight}
                              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700"
                            >
                              {highlight}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {event.gallery.map((image, galleryIndex) => (
                            <div
                              key={image}
                              className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-zinc-100"
                            >
                              <Image
                                src={image}
                                alt={`${event.title} - foto ${galleryIndex + 1}`}
                                fill
                                loading="lazy"
                                sizes="(max-width: 640px) 100vw, 30vw"
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                          <a
                            href={event.ctaHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-3 rounded-full bg-black px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5 hover:bg-zinc-800"
                          >
                            Ver mais no Instagram
                            <ArrowRight className="h-4 w-4" />
                          </a>
                          <a
                            href={siteConfig.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-black transition-transform hover:-translate-y-0.5 hover:border-black"
                          >
                            Quero participar da próxima
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 text-black">
        <div className="container px-4">
          <FadeIn delay={0.08}>
            <div className="rounded-[2rem] border border-zinc-200 bg-zinc-50 p-8 text-center shadow-lg shadow-zinc-950/5 sm:p-12">
              <span className="inline-flex rounded-full bg-caicara-yellow px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-black">
                Quer viver a próxima edição?
              </span>
              <h2 className="mt-6 text-4xl font-heading font-black uppercase tracking-tight sm:text-5xl">
                Entre em contato e acompanhe os próximos encontros.
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-zinc-600">
                A melhor forma de saber dos próximos eventos é falar com a equipe no WhatsApp e acompanhar os bastidores
                no Instagram da Caiçara Fit.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <a
                  href={siteConfig.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-caicara-yellow px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-black transition-transform hover:-translate-y-0.5"
                >
                  Falar no WhatsApp
                </a>
                <a
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-black transition-transform hover:-translate-y-0.5 hover:border-black"
                >
                  Abrir Instagram
                </a>
              </div>
              <div className="mt-6 text-sm font-medium text-zinc-500">{siteConfig.instagramHandle}</div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
