export const siteConfig = {
  name: "Caiçara Fit",
  siteUrl: "https://caicara.store",
  heroImage: "/images/hero-group.jpg",
  instagramUrl: "https://instagram.com/caicarafit013",
  instagramHandle: "@caicarafit013",
  phoneDisplay: "(13) 92001-3547",
  phoneE164: "+5513920013547",
  description:
    "Academia e box de CrossFit em São Vicente com treino funcional, beach sports, futevôlei e beach tennis em uma rotina acolhedora para quem quer evoluir com constância.",
  whatsappUrl:
    "https://api.whatsapp.com/send?phone=5513920013547&text=Olá! Gostaria de falar com a Caiçara Fit.",
  trialWhatsappUrl:
    "https://api.whatsapp.com/send?phone=5513920013547&text=Olá! Gostaria de resgatar minha 1 semana de aula grátis!",
  googleMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Cai%C3%A7ara%20Fit%20S%C3%A3o%20Vicente",
  googleReviewUrl: process.env.GOOGLE_PLACE_ID
    ? `https://search.google.com/local/writereview?placeid=${process.env.GOOGLE_PLACE_ID}`
    : "https://www.google.com/maps/search/?api=1&query=Cai%C3%A7ara%20Fit%20S%C3%A3o%20Vicente",
  address: {
    streetAddress: "Av. Embaixador Pedro de Toledo, 593",
    locality: "São Vicente",
    region: "SP",
    postalCode: "11320-440",
    country: "BR",
  },
  geo: {
    latitude: -23.9618,
    longitude: -46.3322,
  },
};

export const navigationLinks = [
  { href: "/#sobre", label: "Sobre" },
  { href: "/#planos", label: "Planos" },
  { href: "/eventos", label: "Eventos" },
  { href: "/blog", label: "Blog" },
] as const;
