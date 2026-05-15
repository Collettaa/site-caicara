import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Camera, Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a Caiçara Fit em São Vicente. Veja endereço, WhatsApp, Instagram e mapa para conhecer a academia.",
  alternates: {
    canonical: "/contato",
  },
};

const contactCards = [
  {
    title: "WhatsApp",
    description: "Tire dúvidas sobre planos, aula experimental e horários.",
    label: siteConfig.phoneDisplay,
    href: siteConfig.whatsappUrl,
    icon: MessageCircle,
    external: true,
  },
  {
    title: "Endereço",
    description: `${siteConfig.address.streetAddress}, ${siteConfig.address.locality} - ${siteConfig.address.region}`,
    label: "Abrir no mapa",
    href: siteConfig.googleMapsUrl,
    icon: MapPin,
    external: true,
  },
  {
    title: "Instagram",
    description: "Acompanhe bastidores, eventos e rotina da comunidade.",
    label: siteConfig.instagramHandle,
    href: siteConfig.instagramUrl,
    icon: Camera,
    external: true,
  },
];

export default function ContatoPage() {
  return (
    <>
      <section className="bg-zinc-950 py-24 text-white sm:py-32">
        <div className="container px-4">
          <div className="max-w-4xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-caicara-yellow">
              Contato Caiçara
            </span>
            <h1 className="mt-6 font-heading text-4xl font-black uppercase leading-[0.98] tracking-tight sm:text-6xl">
              Fale com a equipe e venha conhecer nosso espaço.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
              Estamos em São Vicente para receber quem quer começar, voltar a treinar ou encontrar uma comunidade com
              treino forte, orientação de perto e rotina mais leve.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href={siteConfig.trialWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 items-center justify-center rounded-full bg-caicara-yellow px-8 text-sm font-bold uppercase tracking-[0.12em] text-black transition-transform hover:-translate-y-0.5"
              >
                Agendar aula experimental
                <ArrowRight className="ml-3 h-4 w-4" />
              </a>
              <a
                href={siteConfig.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 items-center justify-center rounded-full border border-white/20 bg-white/8 px-8 text-sm font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black"
              >
                Ver localização
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 text-zinc-950 sm:py-28">
        <div className="container px-4">
          <div className="grid gap-5 md:grid-cols-3">
            {contactCards.map((card) => {
              const Icon = card.icon;

              return (
                <a
                  key={card.title}
                  href={card.href}
                  target={card.external ? "_blank" : undefined}
                  rel={card.external ? "noopener noreferrer" : undefined}
                  className="group flex h-full flex-col rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-7 transition-shadow hover:shadow-lg hover:shadow-zinc-950/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-caicara-yellow text-black">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-8 font-heading text-2xl font-black uppercase tracking-[-0.02em]">
                    {card.title}
                  </h2>
                  <p className="mt-4 flex-1 leading-relaxed text-zinc-600">{card.description}</p>
                  <span className="mt-6 inline-flex items-center text-sm font-bold uppercase tracking-[0.12em] text-zinc-950 transition-colors group-hover:text-caicara-yellow-dark">
                    {card.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </a>
              );
            })}
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Atendimento presencial
              </span>
              <h2 className="mt-5 font-heading text-3xl font-black uppercase leading-[0.98] tracking-[-0.03em] sm:text-5xl">
                Caiçara Fit em São Vicente
              </h2>
              <div className="mt-8 grid gap-5 text-zinc-700">
                <p className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-caicara-yellow-dark" />
                  <span>
                    {siteConfig.address.streetAddress}, {siteConfig.address.locality} - {siteConfig.address.region},{" "}
                    CEP {siteConfig.address.postalCode}
                  </span>
                </p>
                <p className="flex items-start gap-3">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-caicara-yellow-dark" />
                  <span>{siteConfig.phoneDisplay}</span>
                </p>
                <p className="flex items-start gap-3">
                  <Clock className="mt-1 h-5 w-5 shrink-0 text-caicara-yellow-dark" />
                  <span>Segunda a sexta das 6h às 22h. Sábado das 8h às 12h.</span>
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-7">
              <h3 className="font-heading text-2xl font-black uppercase tracking-[-0.02em]">
                Comece pela aula experimental
              </h3>
              <p className="mt-4 leading-relaxed text-zinc-600">
                A primeira conversa ajuda a equipe a entender seu momento, seu histórico e o tipo de treino que faz
                sentido para sua rotina. Depois disso, você conhece o box, sente o ambiente e decide com calma.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href={siteConfig.trialWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-zinc-800"
                >
                  Falar no WhatsApp
                </a>
                <Link
                  href="/sobre"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-zinc-950 transition-colors hover:border-zinc-950"
                >
                  Conhecer a academia
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
