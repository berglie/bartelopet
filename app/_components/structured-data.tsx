export function StructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ÅpenAid',
    url: 'https://barteløpet.no',
    logo: 'https://barteløpet.no/favicon.png',
    description: 'Støtter mental helse gjennom Movember',
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
    name: 'Barteløpet 2025',
    description: 'Virtuelt løp for mental helse i forbindelse med Movember-kampanjen',
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
    startDate: '2025-01-01',
    endDate: '2025-12-31',
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
      'Delta i Barteløpet for Movember - løp for mental helse, del dine bilder og stem på andre deltakere',
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
