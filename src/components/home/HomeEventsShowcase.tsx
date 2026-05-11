import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { featuredEvents } from "@/content/events";
import { siteConfig } from "@/lib/site";

export function HomeEventsShowcase() {
  const featuredEvent = featuredEvents[0];

  return (
    <section className="bg-[#f7f3ea] py-20 text-zinc-950 sm:py-28">
      <div className="container px-4">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <FadeIn delay={0.08}>
            <div className="max-w-xl">
              <span className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Eventos e comunidade
              </span>
              <h2 className="mt-5 font-heading text-4xl font-black uppercase leading-[0.98] tracking-[-0.035em] sm:text-6xl">
                O treino também vira encontro.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-zinc-600">
                A home mostra só um respiro da vida fora do treino tradicional. Os recaps completos ficam na página de
                eventos, com fotos, contexto e bastidores.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/eventos"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-7 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-zinc-800"
                >
                  Ver eventos
                  <ArrowRight className="ml-3 h-4 w-4" />
                </Link>
                <a
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold uppercase tracking-[0.12em] text-zinc-950 underline decoration-zinc-300 underline-offset-8 transition-colors hover:text-caicara-yellow-dark"
                >
                  Instagram
                </a>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.16} direction="up">
            <Link href={`/eventos#${featuredEvent.slug}`} className="group block">
              <figure>
                <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] bg-zinc-200 sm:min-h-[520px]">
                  <Image
                    src={featuredEvent.heroImage}
                    alt={featuredEvent.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-zinc-200">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-caicara-yellow" />
                        {featuredEvent.dateLabel}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-caicara-yellow" />
                        {featuredEvent.location}
                      </span>
                    </p>
                    <h3 className="mt-4 max-w-2xl font-heading text-3xl font-black uppercase leading-[0.98] tracking-[-0.03em] sm:text-5xl">
                      {featuredEvent.title}
                    </h3>
                  </div>
                </div>
                <figcaption className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600">
                  {featuredEvent.summary}
                </figcaption>
              </figure>
            </Link>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
