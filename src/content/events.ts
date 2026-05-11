import { siteConfig } from "@/lib/site";

export type EventItem = {
  slug: string;
  title: string;
  label: string;
  dateLabel: string;
  location: string;
  summary: string;
  highlights: string[];
  heroImage: string;
  gallery: string[];
  ctaHref: string;
};

export const events: EventItem[] = [
  {
    slug: "caicara-experience",
    title: "Yoga Day e Caiçara Experience",
    label: "Praia + bem-estar",
    dateLabel: "18/04 | edição especial",
    location: "Praia do Itararé, São Vicente",
    summary:
      "O Caiçara Experience levou a energia do box para a areia com uma manhã de yoga, mini WOD, fotos, açaí e conexão verdadeira com o estilo de vida do litoral.",
    highlights: [
      "Yoga ao nascer do sol com clima leve e acolhedor.",
      "Mini WOD adaptado para diferentes níveis de treino.",
      "Café da manhã, fotos e troca entre alunos e convidados.",
    ],
    heroImage: "/images/events/yoga/yoga-day-hero.jpg",
    gallery: ["/images/events/yoga/yoga-day-circle.jpg", "/images/events/yoga/yoga-day-details.jpg"],
    ctaHref: siteConfig.instagramUrl,
  },
  {
    slug: "hd-hyrox-day",
    title: "HD / Hyrox Day",
    label: "Desafio funcional",
    dateLabel: "23/04 | outdoor workout",
    location: "Praça Tom Jobim e orla de São Vicente",
    summary:
      "O HD levou o ritmo da Caiçara para fora do box com estações inspiradas em Hyrox, trenó, deslocamentos curtos e muita torcida para quem topou sair da rotina.",
    highlights: [
      "Formato dinâmico, pensado para gerar superação com espírito de equipe.",
      "Ativações na praça e na orla, conectando treino e cidade.",
      "Experiência para sentir força, fôlego e diversão no mesmo encontro.",
    ],
    heroImage: "/images/events/hyrox/hyrox-day-hero.jpg",
    gallery: ["/images/events/hyrox/hyrox-day-portrait.jpg", "/images/events/hyrox/hyrox-day-team.jpg"],
    ctaHref: siteConfig.instagramUrl,
  },
  {
    slug: "corrida-5km-caicara",
    title: "Aulão de Corrida e 5KM Caiçara",
    label: "Ritmo coletivo",
    dateLabel: "26/04 | ativação especial",
    location: "São Vicente, com encontros na praia e no box",
    summary:
      "Entre a preparação no box e os encontros ao ar livre, a Caiçara também puxou a energia da corrida com aulão coletivo e clima de 5KM para todo mundo participar.",
    highlights: [
      "Aquecimentos e encontros acessíveis para quem queria ganhar ritmo.",
      "Treino coletivo com foco em constância, confiança e companheirismo.",
      "Corrida pensada como experiência de grupo, sem pressão desnecessária.",
    ],
    heroImage: "/images/events/corrida/corrida-day-hero.jpg",
    gallery: ["/images/events/corrida/corrida-day-training.jpg", "/images/events/corrida/corrida-day-community.jpg"],
    ctaHref: siteConfig.instagramUrl,
  },
];

export const featuredEvents = events.slice(0, 3);
