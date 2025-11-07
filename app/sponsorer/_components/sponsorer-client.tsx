'use client';

import { SponsorSection } from './sponsor-section';
import { SponsorCard } from './sponsor-card';
import { Button } from '@/app/_shared/components/ui/button';
import { Gift, Heart, Mail, Newspaper } from 'lucide-react';
import type { GroupedSponsors } from '@/app/_shared/types/sponsor';
import Link from 'next/link';

const SPLEIS_URL = 'https://spleis.no/barteløpet2025';

// Media mentions
interface MediaMention {
  id: string;
  title: string;
  source: string;
  url: string;
}

const MEDIA_MENTIONS: MediaMention[] = [
  {
    id: '1',
    title: 'Hvis du ikke vil gro ut barten, kan du nå løpe den',
    source: 'Rogalands Avis',
    url: 'https://www.rastavanger.no/hvis-du-ikke-vil-gro-ut-barten-kan-du-na-lope-den/s/5-165-172592',
  },
  {
    id: '2',
    title: 'Lie Ventilasjon støtter Barteløpet',
    source: 'LinkedIn',
    url: 'https://www.linkedin.com/posts/lie-ventilasjon_jeg-har-startet-bartel%C3%B8pet-et-veldedig-activity-7392086471974940672-s-7h?utm_source=share&utm_medium=member_desktop&rcm=ACoAABLk3McBGObaNo_XK90D3zZNFfEQn7s6120',
  },
];

// Sponsor data (alfabetisk sortert)
const SPONSORS_DATA: GroupedSponsors = {
  merchandise: [
    {
      id: '11',
      name: 'Ark Prostebakken Stavanger',
      category: 'merchandise',
      website_url: 'https://www.ark.no/butikker/stavanger/ark-prostebakken-stavanger',
      prize: 'Brettspill',
    },
    {
      id: '1',
      name: 'Comfyballs',
      category: 'merchandise',
      website_url: 'https://www.comfyballs.no/',
      prize: 'Gavekort',
    },
    {
      id: '2',
      name: 'Gnu Bar',
      category: 'merchandise',
      website_url: 'https://gnubar.no/',
      prize: 'To be announced',
    },
    {
      id: '3',
      name: 'Helgø Meny Herbarium',
      category: 'merchandise',
      website_url: 'https://meny.no/finn-butikk/helgo-meny-herbarium/',
      prize: 'Gavekort',
    },
    {
      id: '4',
      name: 'Kongeparken',
      category: 'merchandise',
      website_url: 'https://www.kongeparken.no/',
      prize: 'Info kommer snart',
    },
    {
      id: '5',
      name: 'Lucky Bowl Mariero',
      category: 'merchandise',
      website_url: 'https://luckybowl.no/stavanger/mariero/',
      prize: 'Gavekort',
    },
    {
      id: '9',
      name: 'Lucky Bowl & Lounge Stavanger',
      category: 'merchandise',
      website_url: 'https://luckybowl.no/stavanger/stavanger-sentrum/',
      prize: 'Gavekort',
    },
    {
      id: '7',
      name: 'Metallteknikk AS',
      category: 'merchandise',
      website_url: 'https://metallteknikk.no/',
      prize: '🏆 Pokal',
    },
    {
      id: '10',
      name: 'Molinå Bakery',
      category: 'merchandise',
      website_url: 'https://www.molino-bakery.com/',
      prize: 'Gavekort på ett valgfritt brød',
    },
    {
      id: '6',
      name: 'SpareBank 1 Sør-Norge',
      category: 'merchandise',
      website_url: 'https://www.sparebank1.no/nb/sor-norge/',
      prize: 'Reklameartikler',
    },
    {
      id: '8',
      name: 'Vår Energi Arena',
      category: 'merchandise',
      website_url: 'https://varenergiarenasormarka.no/',
      prize: 'Gavekort',
    },
  ],
  trophy: [],
  donation: [],
};

export function SponsorsClient() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 py-16 md:py-20 relative">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 px-4 py-2 rounded-full">
              <Heart className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">
                Våre sponsorer
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Takk til våre sponsorer
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg text-muted-foreground">
              Disse bedriftene bidrar til å gjøre Barteløpet mulig og støtter
              Mental Helse Ungdom
            </p>
          </div>
        </div>
      </section>

      {/* Sponsors Grid Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Mobile: Stacked layout, Desktop: 4-column grid */}
            <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-8 lg:gap-y-12">
              {/* Premier Header - Spans 2 columns on desktop */}
              <div className="lg:col-span-2 space-y-3 text-center">
                <div className="flex items-center gap-3 justify-center">
                  <div className="flex-shrink-0 text-accent">
                    <Gift className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    Premier
                  </h2>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">
                  Bedrifter som bidrar med premier og reklameartikler
                </p>
              </div>

              {/* Donasjoner Header - Desktop only */}
              <div className="hidden lg:block space-y-3 text-center lg:text-left">
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <div className="flex-shrink-0 text-accent">
                    <Heart className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    Donasjoner
                  </h2>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">
                  Bedrifter som støtter med donasjoner
                </p>
              </div>

              {/* Omtale Header - Desktop only */}
              <div className="hidden lg:block space-y-3 text-center lg:text-left">
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <div className="flex-shrink-0 text-accent">
                    <Newspaper className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    Omtale
                  </h2>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">
                  Barteløpet i media og sosiale medier
                </p>
              </div>

              {/* Premier Content Column 1 */}
              <div className="lg:col-span-1 space-y-4">
                {SPONSORS_DATA.merchandise.slice(0, Math.ceil(SPONSORS_DATA.merchandise.length / 2)).map((sponsor) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} />
                ))}
              </div>

              {/* Premier Content Column 2 */}
              <div className="lg:col-span-1 space-y-4">
                {SPONSORS_DATA.merchandise.slice(Math.ceil(SPONSORS_DATA.merchandise.length / 2)).map((sponsor) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} />
                ))}
              </div>

              {/* Donasjoner Section */}
              <div className="space-y-6 lg:space-y-0">
                {/* Donasjoner Header - Mobile only */}
                <div className="lg:hidden space-y-3 text-center lg:text-left mb-6">
                  <div className="flex items-center gap-3 justify-center lg:justify-start">
                    <div className="flex-shrink-0 text-accent">
                      <Heart className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                      Donasjoner
                    </h2>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Bedrifter som støtter med donasjoner
                  </p>
                </div>

                {/* Spleis CTA Card */}
                <a
                  href={SPLEIS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="rounded-lg border text-card-foreground shadow-sm bg-card/50 border-border/50 backdrop-blur hover:border-accent/50 transition-all h-full">
                    <div className="p-4 md:p-6 space-y-3">
                      <h3 className="text-lg md:text-xl font-semibold text-foreground">
                        Vil du bidra?
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Støtt Barteløpet og Mental Helse Ungdom gjennom vår spleis
                      </p>
                      <div className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors">
                        <span className="text-sm">Besøk spleis</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" x2="21" y1="14" y2="3"></line>
                        </svg>
                      </div>
                    </div>
                  </div>
                </a>
              </div>

              {/* Omtale Section */}
              <div className="space-y-6 lg:space-y-0">
                {/* Omtale Header - Mobile only */}
                <div className="lg:hidden space-y-3 text-center lg:text-left mb-6">
                  <div className="flex items-center gap-3 justify-center lg:justify-start">
                    <div className="flex-shrink-0 text-accent">
                      <Newspaper className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                      Omtale
                    </h2>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Barteløpet i media og sosiale medier
                  </p>
                </div>

                {/* Media Mention Cards */}
                <div className="space-y-4">
                  {MEDIA_MENTIONS.map((mention) => (
                    <a
                      key={mention.id}
                      href={mention.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div className="rounded-lg border text-card-foreground shadow-sm bg-card/50 border-border/50 backdrop-blur hover:border-accent/50 transition-all h-full">
                        <div className="p-4 md:p-6 space-y-3">
                          <h3 className="text-lg md:text-xl font-semibold text-foreground">
                            {mention.title}
                          </h3>
                          <p className="text-sm md:text-base text-muted-foreground">
                            {mention.source}
                          </p>
                          <div className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors">
                            <span className="text-sm">Les mer</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3 w-3"
                            >
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" x2="21" y1="14" y2="3"></line>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/50 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Interessert i å sponse Barteløpet?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground">
              Vi setter stor pris på alle bidrag som hjelper oss å støtte Mental
              Helse Ungdom
            </p>
            <Link href="/kontakt">
              <Button
                size="lg"
                className="gap-2 bg-accent hover:bg-accent/90 text-primary"
              >
                <Mail className="h-4 w-4" />
                Kontakt oss
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
