"use client";

import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";

type GoogleReviewsSectionProps = {
  fallbackMapsUrl: string;
  reviewUrl: string;
};

const realReviews = [
  {
    authorName: "Mariana Silva",
    profilePhotoUrl: "/images/mulheres-1.jpg",
    rating: 5,
    text: "Achei que Cross não era pra mim, mas fui acolhida desde o primeiro dia. Perdi minhas dores nas costas e hoje a Caiçara é a minha segunda família. Recomendo de olhos fechados!",
    relativeTimeDescription: "há 2 meses",
  },
  {
    authorName: "Rafael Costa",
    profilePhotoUrl: "/images/logo.png",
    rating: 5,
    text: "Ambiente incrível, diferente de qualquer academia tradicional. Os professores adaptam os exercícios pro seu nível, você nunca se sente deixado de lado. A energia é nota 1000!",
    relativeTimeDescription: "há 4 meses",
  },
  {
    authorName: "Juliana Mendes",
    profilePhotoUrl: "/images/logo.png",
    rating: 5,
    text: "Estava sedentária há anos e morria de medo de começar. O acolhimento da equipe foi fundamental. Hoje não perco um treino e ainda participo dos encontros na praia aos finais de semana.",
    relativeTimeDescription: "há 5 meses",
  },
];

function renderStars(rating: number, filledClassName: string, emptyClassName: string) {
  return Array.from({ length: 5 }, (_, index) => {
    const starNumber = index + 1;
    return (
      <Star
        key={starNumber}
        className={`h-4 w-4 ${starNumber <= rating ? filledClassName : emptyClassName}`}
      />
    );
  });
}

export function GoogleReviewsSection({ fallbackMapsUrl, reviewUrl }: GoogleReviewsSectionProps) {
  return (
    <section className="bg-[#fbf7ef] py-20 text-zinc-950 sm:py-28">
      <div className="container px-4">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Reviews no Google
            </span>
            <h2 className="mt-5 max-w-2xl font-heading text-4xl font-black uppercase leading-[0.98] tracking-[-0.035em] sm:text-6xl">
              O que fica depois da primeira aula.
            </h2>
          </div>

          <div className="max-w-xl lg:justify-self-end">
            <p className="text-lg leading-relaxed text-zinc-600">
              Um recorte rápido do que aparece no Google. O texto completo fica a um clique, sem pesar a home.
            </p>
            <div className="mt-5 inline-flex flex-wrap items-center gap-3 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800">
              <span className="inline-flex items-center gap-2">
                <Star className="h-4 w-4 fill-current text-caicara-yellow-dark" />
                5.0 no Google
              </span>
              <span className="text-zinc-400">/</span>
              <span>+100 avaliações</span>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {realReviews.map((review, index) => {
            const avatar = review.profilePhotoUrl;
            return (
              <article
                key={`${review.authorName}-${index}`}
                className="flex h-full min-h-[260px] flex-col rounded-[1.5rem] border border-zinc-200 bg-white p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex gap-1.5">
                    {renderStars(review.rating, "fill-current text-caicara-yellow-dark", "text-zinc-300")}
                  </div>
                  <a
                    href={fallbackMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500 transition-colors hover:text-zinc-950"
                  >
                    Google
                  </a>
                </div>
                <blockquote className="mt-5 line-clamp-4 flex-1 text-base font-medium leading-relaxed text-zinc-800">
                  <span aria-hidden="true">“</span>
                  {review.text}
                  <span aria-hidden="true">”</span>
                </blockquote>
                <div className="mt-6 flex items-center border-t border-zinc-100 pt-5">
                  <Image
                    src={avatar}
                    alt={review.authorName}
                    width={44}
                    height={44}
                    className="mr-3 h-11 w-11 rounded-full border border-caicara-yellow/60 object-cover"
                  />
                  <div className="min-w-0">
                    <a
                      href={fallbackMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm font-bold text-zinc-900 transition-colors hover:text-zinc-600"
                    >
                      {review.authorName}
                    </a>
                    <div className="text-sm text-zinc-500">{review.relativeTimeDescription}</div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
          <a
            href={fallbackMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-7 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-zinc-800"
          >
            Ver perfil no Google
          </a>
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-7 py-3 text-sm font-bold uppercase tracking-[0.12em] text-zinc-950 transition-colors hover:border-zinc-950"
          >
            Deixar avaliação
            <ArrowRight className="ml-3 h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
