export const siteConfig = {
  name: "Caiçara Fit",
  siteUrl: "https://caicara.store",
  heroImage: "/images/hero-group.jpg",
  instagramUrl: "https://instagram.com/caicarafit013",
  instagramHandle: "@caicarafit013",
  phoneDisplay: "(13) 92001-3547",
  phoneE164: "+5513920013547",
  whatsappUrl:
    "https://api.whatsapp.com/send?phone=5513920013547&text=Olá! Gostaria de falar com a Caiçara Fit.",
  trialWhatsappUrl:
    "https://api.whatsapp.com/send?phone=5513920013547&text=Olá! Gostaria de resgatar minha 1 semana de aula grátis!",
  address: {
    streetAddress: "Av. Embaixador Pedro de Toledo, 593",
    locality: "São Vicente",
    region: "SP",
    postalCode: "11320-440",
    country: "BR",
  },
};

export const navigationLinks = [
  { href: "/#sobre", label: "Sobre" },
  { href: "/#planos", label: "Planos" },
  { href: "/eventos", label: "Eventos" },
  { href: "/blog", label: "Blog" },
] as const;
