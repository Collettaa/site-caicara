export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness", // Health club/Gym fits here or SportsActivityLocation
    "name": "Caiçara Fit",
    "image": "https://caicarafit.com.br/logo.png", // TODO: Update
    "@id": "https://caicarafit.com.br",
    "url": "https://caicarafit.com.br",
    "telephone": "+5513920013547", // TODO: Update
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Av. Embaixador pedro de toledo, 593", // TODO: Update
      "addressLocality": "São Vicente",
      "addressRegion": "SP",
      "postalCode": "11320-440",
      "addressCountry": "BR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -23.9618, // TODO: Update with real Santos/Guarujá coords
      "longitude": -46.3322
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "06:00",
      "closes": "22:00"
    },
    "sameAs": [
      "https://instagram.com/caicarafit013"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
