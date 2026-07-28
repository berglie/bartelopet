export function StructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ÅpenAid',
    url: 'https://barteløpet.no',
    logo: 'https://barteløpet.no/favicon.png',
    description: 'Arrangør av Barteløpet, et virtuelt veldedighetsløp for Prosjekt SUT',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      url: 'https://barteløpet.no/kontakt',
    },
    sameAs: [],
  };

  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: 'Barteløpet 2026',
    description:
      'Løp hvor du vil i november, doner fem kroner per kilometer til Prosjekt SUT og samle premielodd',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: 'https://barteløpet.no',
    },
    organizer: {
      '@type': 'Organization',
      name: 'ÅpenAid',
      url: 'https://barteløpet.no',
    },
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'NOK',
      availability: 'https://schema.org/InStock',
      url: 'https://barteløpet.no/pamelding',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Barteløpet',
    url: 'https://barteløpet.no',
    description:
      'Delta i Barteløpet 2026 – løp hvor du vil, støtt Prosjekt SUT og samle premielodd',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://barteløpet.no/deltakere?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
