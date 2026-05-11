import { siteConfig } from "@/lib/site";

export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["ExerciseGym", "HealthClub"],
    "@id": `${siteConfig.siteUrl}#business`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.siteUrl,
    image: [`${siteConfig.siteUrl}/images/logo.png`, `${siteConfig.siteUrl}${siteConfig.heroImage}`],
    telephone: siteConfig.phoneE164,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.streetAddress,
      addressLocality: siteConfig.address.locality,
      addressRegion: siteConfig.address.region,
      postalCode: siteConfig.address.postalCode,
      addressCountry: siteConfig.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.geo.latitude,
      longitude: siteConfig.geo.longitude,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "06:00:00",
        closes: "22:00:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "08:00:00",
        closes: "12:00:00",
      },
    ],
    areaServed: [
      {
        "@type": "City",
        name: "São Vicente",
      },
      {
        "@type": "AdministrativeArea",
        name: "Baixada Santista",
      },
    ],
    hasMap: siteConfig.googleMapsUrl,
    knowsAbout: [
      "CrossFit", 
      "treino funcional", 
      "beach sports", 
      "futevôlei", 
      "beach tennis", 
      "condicionamento físico",
      "Cross",
      "crosstraining",
      "academia",
      "academia de crossfit"
    ],
    sameAs: [siteConfig.instagramUrl, siteConfig.googleMapsUrl],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
