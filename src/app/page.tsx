import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Heart, Star, Sun, Users, MapPin } from "lucide-react";
import { LocalBusinessSchema } from "@/components/seo/LocalBusinessSchema";
import { FadeIn } from "@/components/animations/FadeIn";
import { featuredEvents } from "@/content/events";
import { getGoogleReviews } from "@/lib/google-places";
import { siteConfig } from "@/lib/site";

export default async function Home() {
  const reviews = await getGoogleReviews();

  return (
    <>
      <LocalBusinessSchema />

      <section className="relative flex min-h-[95vh] items-center justify-center overflow-hidden bg-zinc-950 pt-20 pb-12">
        <div className="absolute inset-0 z-0 bg-black">
          <Image
            src={siteConfig.heroImage}
            alt="Família Caiçara reunida no treino"
            fill
            priority
            className="animate-in zoom-in scale-105 object-cover object-center fade-in duration-1000"
          />
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/80 via-black/40 to-zinc-950" />
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
        </div>

        <div className="container relative z-20 mt-16 flex w-full flex-col items-center px-4 text-center sm:items-start sm:text-left">
          <FadeIn delay={0.1}>
            <div className="mb-10 inline-flex items-center rounded-full border border-white/10 bg-black/30 px-6 py-2 text-xs text-caicara-yellow shadow-2xl backdrop-blur-md transition-all hover:bg-black/40 sm:text-sm">
              <span className="mr-3 flex h-2 w-2 rounded-full bg-caicara-yellow shadow-[0_0_10px_rgba(250,204,21,0.6)]" />
              <span className="font-medium uppercase tracking-[0.2em]">Vagas limitadas • 1 semana grátis</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h1 className="mb-8 flex max-w-4xl flex-col items-center text-white sm:items-start">
              <span className="mb-2 font-serif text-4xl italic text-white/80 sm:text-6xl">Lugar de</span>
              <span className="bg-gradient-to-b from-white via-caicara-yellow to-yellow-600 bg-clip-text py-2 font-heading text-[5.5rem] font-black uppercase leading-[0.8] tracking-tighter text-transparent drop-shadow-xl sm:text-[8rem] md:text-[10rem] lg:text-[12rem]">
                CAIÇARA
              </span>
              <span className="mt-3 font-heading text-2xl font-bold uppercase tracking-[0.3em] text-white/90 sm:ml-2 sm:text-4xl">
                É aqui.
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="mb-14 max-w-2xl text-center text-base leading-relaxed text-zinc-300/90 sm:border-l-[3px] sm:border-caicara-yellow sm:pl-6 sm:text-left sm:text-lg md:text-xl">
              Resultados de verdade em um ambiente onde você não é só um número.
              <strong className="font-medium text-white"> Transforme seu corpo e sua rotina</strong> na comunidade
              mais acolhedora da Baixada Santista.
            </p>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
              <a
                href={siteConfig.trialWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-caicara-yellow px-8 font-sans text-sm font-bold uppercase tracking-[0.1em] text-black shadow-lg transition-all hover:scale-105 active:scale-95 sm:h-16 sm:w-auto sm:px-10 sm:text-base"
              >
                <span className="absolute inset-0 h-full w-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-opacity duration-300 group-hover:opacity-90" />
                <span className="relative flex items-center gap-3">
                  Liberar minha aula
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </a>
              <Link
                href="/eventos"
                className="inline-flex h-14 w-full items-center justify-center rounded-full border border-white/20 bg-transparent px-8 font-sans text-sm font-medium uppercase tracking-[0.1em] text-white transition-all duration-500 hover:bg-white hover:text-black sm:h-16 sm:w-auto sm:px-10 sm:text-base"
              >
                Explorar eventos
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="sobre" className="scroll-mt-32 bg-zinc-50 py-24 text-black">
        <div className="container px-4">
          <FadeIn delay={0.1}>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="mb-6 text-4xl font-heading font-black uppercase tracking-tight sm:text-6xl">
                Por que a <span className="text-caicara-yellow">Caiçara?</span>
              </h2>
              <p className="text-xl font-medium text-zinc-600">
                Nós não vendemos culto ao corpo perfeito. Nós oferecemos acolhimento, lazer e superação pessoal.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <FadeIn delay={0.2} direction="up">
              <div className="flex h-full flex-col items-center rounded-3xl border border-zinc-100 bg-white p-10 text-center shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                  <Heart className="h-10 w-10" />
                </div>
                <h3 className="mb-4 text-3xl font-heading font-black uppercase">Acolhimento</h3>
                <p className="text-lg text-zinc-600">
                  Todo mundo começa do zero. Não importa sua idade ou tipo físico: nós guiamos você com cuidado e
                  atenção real.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.3} direction="up">
              <div className="flex h-full flex-col items-center rounded-3xl border border-zinc-100 bg-white p-10 text-center shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                  <Users className="h-10 w-10" />
                </div>
                <h3 className="mb-4 text-3xl font-heading font-black uppercase">Comunidade</h3>
                <p className="text-lg text-zinc-600">
                  Aqui você não é um número. Você faz parte da Família Caiçara e celebra cada pequena conquista junto
                  com a tribo.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.4} direction="up">
              <div className="flex h-full flex-col items-center rounded-3xl border border-zinc-100 bg-white p-10 text-center shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                  <Sun className="h-10 w-10" />
                </div>
                <h3 className="mb-4 text-3xl font-heading font-black uppercase">Estilo de vida</h3>
                <p className="text-lg text-zinc-600">
                  Treinos dinâmicos, pé na areia e eventos ao ar livre para conectar saúde, energia e bem-estar no dia
                  a dia.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section id="planos" className="scroll-mt-32 bg-white py-24 text-black">
        <div className="container px-4">
          <FadeIn delay={0.1}>
            <div className="mx-auto mb-16 max-w-4xl text-center">
              <span className="inline-flex rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Planos e modalidades
              </span>
              <h2 className="mt-6 text-4xl font-heading font-black uppercase tracking-tight sm:text-6xl">
                CrossFit e funcional em <span className="text-caicara-yellow">São Vicente</span>
              </h2>
              <p className="mt-6 text-xl font-medium text-zinc-600">
                Sem jargão complicado. O melhor do CrossTraining adaptado para a sua realidade, com foco em saúde,
                mobilidade e evolução constante.
              </p>
            </div>
          </FadeIn>

          <div className="grid h-auto grid-cols-1 gap-8 md:h-[500px] md:grid-cols-2">
            <FadeIn delay={0.2} direction="right" className="h-full">
              <div className="group relative h-[400px] overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 shadow-lg md:h-full">
                <Image
                  src="/images/open-1.jpeg"
                  alt="Treino funcional e cross da Caiçara Fit"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-8 text-white sm:p-10">
                  <h3 className="mb-4 text-4xl font-heading font-black uppercase">Funcional &amp; Cross</h3>
                  <p className="mb-8 max-w-md text-lg text-zinc-200">
                    Treinos adaptados para ganhar mobilidade, força e fôlego para o dia a dia. Para você viver melhor,
                    sem dores e com mais energia.
                  </p>
                  <a
                    href={siteConfig.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-fit items-center font-heading text-lg font-bold uppercase tracking-wider text-caicara-yellow transition-colors hover:text-yellow-300"
                  >
                    Agendar aula <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.3} direction="left" className="h-full">
              <div className="group relative h-[400px] overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 shadow-lg md:h-full">
                <Image
                  src="/images/beach-sports-new.jpg"
                  alt="Treinos ao ar livre da Caiçara Fit"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-8 text-white sm:p-10">
                  <h3 className="mb-4 text-4xl font-heading font-black uppercase">Beach training</h3>
                  <p className="mb-8 max-w-md text-lg text-zinc-200">
                    A energia da praia também faz parte da rotina da Caiçara, com treinos ao ar livre, ativações
                    especiais e eventos que deixam tudo mais leve.
                  </p>
                  <a
                    href={siteConfig.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-fit items-center font-heading text-lg font-bold uppercase tracking-wider text-caicara-yellow transition-colors hover:text-yellow-300"
                  >
                    Falar sobre planos <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </div>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.35} direction="up">
            <div className="mt-8 rounded-[2rem] border border-zinc-200 bg-zinc-50 p-8 shadow-lg shadow-zinc-950/5 sm:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Planos flexíveis
                  </span>
                  <h3 className="mt-5 text-3xl font-heading font-black uppercase tracking-tight sm:text-4xl">
                    Comece do seu jeito e ajuste o ritmo com a equipe.
                  </h3>
                  <p className="mt-4 text-lg leading-relaxed text-zinc-600">
                    A Caiçara monta a melhor entrada para quem está começando, voltando a treinar ou buscando mais
                    constância. O plano ideal sai em conversa direta com o box.
                  </p>
                </div>
                <a
                  href={siteConfig.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-black px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5 hover:bg-zinc-800"
                >
                  Ver planos no WhatsApp
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="relative overflow-hidden bg-zinc-950 py-24 text-white sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,193,7,0.16),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_26%)]" />
        <div className="container relative z-10 px-4">
          <FadeIn delay={0.08}>
            <div className="mx-auto mb-12 max-w-3xl text-center lg:mb-16">
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-caicara-yellow">
                Eventos e comunidade
              </span>
              <h2 className="mt-6 text-4xl font-heading font-black uppercase tracking-tight sm:text-6xl">
                A energia da tribo não para no <span className="text-caicara-yellow">box</span>.
              </h2>
              <p className="mt-6 text-xl font-medium text-zinc-300">
                Yoga Day, HD / Hyrox Day e encontros de corrida mostram como a Caiçara transforma treino em experiência
                real.
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <FadeIn delay={0.12}>
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 shadow-2xl shadow-black/30">
                <Image
                  src={featuredEvents[0].heroImage}
                  alt={featuredEvents[0].title}
                  width={1400}
                  height={1600}
                  className="h-[380px] w-full object-cover object-center sm:h-[460px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <span className="inline-flex rounded-full bg-caicara-yellow px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-black">
                    {featuredEvents[0].label}
                  </span>
                  <h3 className="mt-4 text-3xl font-heading font-black uppercase tracking-tight sm:text-5xl">
                    {featuredEvents[0].title}
                  </h3>
                  <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-200">
                    {featuredEvents[0].summary}
                  </p>
                  <ul className="mt-6 space-y-3 text-zinc-100">
                    {featuredEvents[0].highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-caicara-yellow" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link
                      href="/eventos"
                      className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-black transition-transform hover:-translate-y-0.5"
                    >
                      Ver página de eventos
                    </Link>
                  </div>
                </div>
              </div>
            </FadeIn>

            <div className="grid gap-4">
              {featuredEvents.map((event, index) => (
                <FadeIn key={event.slug} delay={0.18 + index * 0.06}>
                  <Link
                    href={`/eventos#${event.slug}`}
                    className="group flex h-full flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 transition-all hover:-translate-y-1 hover:border-caicara-yellow/40 hover:bg-white/8 sm:flex-row sm:items-center"
                  >
                    <div className="relative h-32 overflow-hidden rounded-2xl bg-zinc-900 sm:w-28 sm:shrink-0">
                      <Image
                        src={event.gallery[0] ?? event.heroImage}
                        alt={event.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 112px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400 sm:flex-row sm:flex-wrap sm:items-center">
                        <span className="text-caicara-yellow">{event.label}</span>
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {event.dateLabel}
                        </span>
                      </div>
                      <h3 className="mt-3 text-2xl font-heading font-black uppercase tracking-tight text-white">
                        {event.title}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-300">{event.summary}</p>
                      <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-100">
                        <MapPin className="h-4 w-4 text-caicara-yellow" />
                        {event.location}
                      </p>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-caicara-yellow py-32 text-black">
        <div className="container px-4">
          <FadeIn delay={0.1}>
            <div className="mb-20 text-center">
              <h2 className="mb-6 text-4xl font-heading font-black uppercase tracking-tight sm:text-6xl">
                O que diz <span className="underline decoration-black decoration-4 underline-offset-8">nossa comunidade</span>
              </h2>
              <p className="text-xl font-medium text-black/70">Avaliações reais no Google</p>
            </div>
          </FadeIn>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 3).map((review, index) => {
                const avatar = review.profile_photo_url || "/images/logo.png";

                return (
                  <FadeIn key={`${review.author_name}-${index}`} delay={0.2 + index * 0.1} direction="up">
                    <div className="flex h-full flex-col rounded-3xl bg-white p-8 shadow-xl shadow-black/5 transition-all duration-300 hover:-translate-y-2">
                      <div className="mb-6 flex justify-start">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-6 w-6 ${star <= review.rating ? "fill-current text-caicara-yellow" : "text-zinc-300"}`}
                          />
                        ))}
                      </div>
                      <blockquote className="line-clamp-5 flex-1 text-xl font-medium italic text-zinc-800">
                        <span aria-hidden="true">“</span>
                        {review.text}
                        <span aria-hidden="true">”</span>
                      </blockquote>
                      <div className="mt-auto flex items-center border-t border-zinc-100 pt-6">
                        <Image
                          src={avatar}
                          alt={review.author_name}
                          width={48}
                          height={48}
                          className="mr-4 h-12 w-12 rounded-full border-2 border-caicara-yellow object-cover"
                        />
                        <div>
                          <div className="text-base font-heading font-bold uppercase tracking-wide">
                            {review.author_name}
                          </div>
                          <div className="text-sm font-medium text-zinc-500">{review.relative_time_description}</div>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          ) : (
            <FadeIn delay={0.2} direction="up">
              <div className="mx-auto max-w-4xl rounded-3xl border border-black/10 bg-white/20 p-10 text-center backdrop-blur-sm sm:p-16">
                <div className="mb-8 flex justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-10 w-10 fill-current text-black" />
                  ))}
                </div>
                <blockquote className="mb-12 text-3xl font-heading font-black uppercase leading-tight tracking-tight sm:text-5xl">
                  <span aria-hidden="true">“</span>
                  Achei que Cross não era pra mim, mas fui acolhida desde o primeiro dia. Perdi minhas dores nas
                  costas e hoje a Caiçara é a minha segunda família.
                  <span aria-hidden="true">”</span>
                </blockquote>
                <div className="mt-8 flex items-center justify-center">
                  <div className="relative mr-6 h-20 w-20 overflow-hidden rounded-full border-4 border-black/20 shadow-lg">
                    <Image src="/images/mulheres-1.jpg" alt="Aluna da Caiçara" fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-heading font-black uppercase tracking-wide">Aluna real</div>
                    <div className="font-mono text-sm font-medium text-black/80">Review do Google</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50 py-24 text-black">
        <div className="container px-4">
          <FadeIn delay={0.1}>
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-heading font-black uppercase tracking-tight sm:text-6xl">
                A nossa <span className="text-caicara-yellow">família</span>
              </h2>
              <p className="text-xl font-medium text-zinc-600">Um pouco do dia a dia no box, na praia e nos eventos.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {[
              { src: "/images/mulheres-1.jpg", alt: "Alunas no treino de funcional" },
              { src: "/images/yoga-day-5.jpeg", alt: "Yoga Day na praia" },
              { src: "/images/community.jpg", alt: "Comunidade Caiçara" },
              { src: "/images/running-funcional.jpg", alt: "Treino ao ar livre" },
              { src: "/images/open-1.jpeg", alt: "Treino coletivo da Caiçara" },
              { src: "/images/women-laughing.jpg", alt: "Amizade e energia no treino" },
            ].map((image, index) => (
              <FadeIn key={image.src} delay={0.2 + index * 0.1}>
                <div className="group relative aspect-square overflow-hidden rounded-2xl">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.8}>
            <div className="mt-12 text-center">
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center font-heading text-xl font-black uppercase text-black transition-colors hover:text-caicara-yellow"
              >
                Acompanhe no Instagram <ArrowRight className="ml-2 h-6 w-6" />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50 py-28 text-center">
        <div className="container px-4">
          <FadeIn delay={0.1}>
            <h2 className="mb-8 text-4xl font-heading font-black uppercase tracking-tight text-black sm:text-6xl">
              Pronto para mudar seu <span className="text-caicara-yellow underline decoration-8 underline-offset-8">estilo de vida?</span>
            </h2>
            <p className="mx-auto mb-12 max-w-3xl text-2xl font-medium leading-relaxed text-zinc-600">
              Venha tomar um café com a gente, conhecer a estrutura e fazer sua primeira aula gratuita. Sem pressão,
              com acolhimento de verdade.
            </p>
            <a
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-20 items-center justify-center rounded-xl bg-black px-16 font-heading text-2xl font-black uppercase tracking-wider text-white shadow-2xl transition-all hover:-translate-y-2 hover:bg-zinc-800 hover:shadow-black/30"
            >
              Vem pra família!
            </a>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
