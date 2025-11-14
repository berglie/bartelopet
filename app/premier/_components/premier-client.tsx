'use client';

import { SponsorSection } from './sponsor-section';
import { SponsorCard } from './sponsor-card';
import { Button } from '@/app/_shared/components/ui/button';
import { Gift, Heart, Mail, Newspaper, Trophy } from 'lucide-react';
import type { GroupedSponsors } from '@/app/_shared/types/sponsor';
import Link from 'next/link';
import NextImage from 'next/image';

const SPLEIS_URL = 'https://spleis.no/barteløpet2025';

// Media mentions
interface MediaMention {
  id: string;
  title: string;
  source: string;
  url: string;
  logo_url?: string;
  screenshot_url?: string;
}

const MEDIA_MENTIONS: MediaMention[] = [
  {
    id: '1',
    title: 'Hvis du ikke vil gro ut barten, kan du nå løpe den',
    source: 'Rogalands Avis',
    url: 'https://www.rastavanger.no/hvis-du-ikke-vil-gro-ut-barten-kan-du-na-lope-den/s/5-165-172592',
    logo_url: '/images/sponsors/ra-stavanger.svg',
    screenshot_url: '/images/skjermbilde-ra.png',
  },
  {
    id: '2',
    title: 'Lie Ventilasjon støtter Barteløpet',
    source: 'LinkedIn',
    url: 'https://www.linkedin.com/posts/lie-ventilasjon_jeg-har-startet-bartel%C3%B8pet-et-veldedig-activity-7392086471974940672-s-7h?utm_source=share&utm_medium=member_desktop&rcm=ACoAABLk3McBGObaNo_XK90D3zZNFfEQn7s6120',
    logo_url: '/images/sponsors/lie-ventilasjon.svg',
    screenshot_url: '/images/skjermbilde-lie-ventilasjon.png',
  },
  {
    id: '3',
    title: 'Art By Me Margaret sponser Barteløpet med maleri',
    source: 'Facebook',
    url: 'https://www.facebook.com/ARTBYMEMargaret/',
    logo_url: '/images/sponsors/art-by-me-margaret.avif',
    screenshot_url: '/images/skjermbilde-maleri.png',
  },
];

// Sponsor data (alfabetisk sortert)
const SPONSORS_DATA: GroupedSponsors = {
  merchandise: [
    {
      id: '7',
      name: 'Metallteknikk AS',
      category: 'merchandise',
      website_url: 'https://metallteknikk.no/',
      logo_url: '/images/sponsors/metallteknikk.png',
      contribution: 'Pokal',
    },
    {
      id: '11',
      name: 'Ark',
      category: 'merchandise',
      website_url: 'https://www.ark.no/butikker/stavanger/ark-prostebakken-stavanger',
      logo_url: '/images/sponsors/ark.png',
      contribution: 'Best i Byen brettspill',
    },
    {
      id: '22',
      name: 'Art By Me Margaret',
      category: 'merchandise',
      website_url: 'https://artbymemargaret.no/',
      logo_url: '/images/sponsors/art-by-me-margaret.avif',
      contribution: 'Maleri',
    },
    {
      id: '20',
      name: 'Brgn',
      category: 'merchandise',
      website_url: 'https://brgn.com/',
      logo_url: '/images/sponsors/brgn.webp',
      contribution: 'Caps',
    },
    {
      id: '23',
      name: 'Brødrene Pedersen',
      category: 'merchandise',
      website_url: 'https://www.designforevig.no/butikker/brodrenepedersen/brodrenepedersenbreigata/',
      logo_url: '/images/sponsors/brodrene-pedersen.svg',
      contribution: '- Valbergtårnet lyshus\n- Domkirken lyshus',
    },
    {
      id: '12',
      name: 'Byens Skomaker',
      category: 'merchandise',
      website_url: 'https://www.byensskomaker.no/en/',
      logo_url: '/images/sponsors/byens-skomaker.jpg',
      contribution: 'Gavekort (500 kr)',
    },
    {
      id: '13',
      name: 'Clarion Hotel',
      category: 'merchandise',
      website_url: 'https://www.strawberry.no/hotell/norge/stavanger/clarion-hotel-stavanger/',
      logo_url: '/images/sponsors/clarion-hotel.png',
      contribution: 'Frokost gavekort',
    },
    {
      id: '1',
      name: 'Comfyballs',
      category: 'merchandise',
      website_url: 'https://www.comfyballs.no/',
      logo_url: '/images/sponsors/comfyballs.svg',
      contribution: 'Gavekort (500 kr)',
    },
    {
      id: '14',
      name: 'Døgnvill',
      category: 'merchandise',
      website_url: 'https://www.dognvillburger.no/',
      logo_url: '/images/sponsors/dognvill.svg',
      contribution: 'Vi spanderer middagen gavekort (2 stk)',
    },
    {
      id: '3',
      name: 'Helgø Meny',
      category: 'merchandise',
      website_url: 'https://meny.no/finn-butikk/helgo-meny-herbarium/',
      logo_url: '/images/sponsors/helgo-meny.png',
      contribution: 'Utvalgte varer (500 kr)',
    },
    {
      id: '15',
      name: 'K-Chicken',
      category: 'merchandise',
      website_url: 'https://thekchicken.no/stavanger.html',
      logo_url: '/images/sponsors/k-chicken.jpg',
      contribution: 'Gavekort (500 kr)',
    },
    {
      id: '4',
      name: 'Kongeparken',
      category: 'merchandise',
      website_url: 'https://www.kongeparken.no/',
      logo_url: '/images/sponsors/kongeparken.webp',
      contribution: 'Info kommer snart',
    },
    {
      id: '5',
      name: 'Lucky bown mariero',
      category: 'merchandise',
      website_url: 'https://luckybowl.no/stavanger/mariero/',
      logo_url: '/images/sponsors/lucky-bowl.webp',
      contribution: 'Gavekort (200 kr)',
    },
    {
      id: '9',
      name: 'Lucky bowl lounge',
      category: 'merchandise',
      website_url: 'https://luckybowl.no/stavanger/stavanger-sentrum/',
      logo_url: '/images/sponsors/lucky-bowl.webp',
      contribution: 'Gavekort (200 kr)',
    },
    {
      id: '10',
      name: 'Molinå Bakery',
      category: 'merchandise',
      website_url: 'https://www.molino-bakery.com/',
      logo_url: '/images/sponsors/molinaa.webp',
      contribution: 'Gavekort for valgfritt fersk brød',
    },
    {
      id: '21',
      name: 'Olivenlunden',
      category: 'merchandise',
      website_url: 'https://olivenlunden1830.no/butikker/olivenlunden-1830-breigata-stavanger/',
      logo_url: '/images/sponsors/olivenlunden.svg',
      contribution: 'Gavepakke',
    },
    {
      id: '6',
      name: 'SpareBank 1 Sør-Norge',
      category: 'merchandise',
      website_url: 'https://www.sparebank1.no/nb/sor-norge/',
      logo_url: '/images/sponsors/sparebank1-sor-norge.svg',
      contribution: 'Reklameartikler',
    },
    {
      id: '16',
      name: 'Stavanger Camping',
      category: 'merchandise',
      website_url: 'https://campingen.no/stavanger',
      logo_url: '/images/sponsors/stavanger-camping.avif',
      contribution: '- Karaoke (1 time)\n- Minigolf (4 stk)',
    },
    {
      id: '17',
      name: 'Stavanger Oljemuseum',
      category: 'merchandise',
      website_url: 'https://www.norskolje.museum.no/',
      logo_url: '/images/sponsors/norsk-oljemuseum.png',
      contribution: 'Inngangsbilletter (4 stk)',
    },
    {
      id: '18',
      name: 'Studio welness',
      category: 'merchandise',
      website_url: 'https://studiowellness.no/',
      logo_url: '/images/sponsors/studio-wellness.png',
      contribution: '- Flytetank\n- Voksebehandling av rygg og skuldre\n- Massasje (40 min)',
    },
    {
      id: '8',
      name: 'Vår Energi',
      category: 'merchandise',
      website_url: 'https://varenergiarenasormarka.no/',
      logo_url: '/images/sponsors/vaar-energi.svg',
      contribution: 'Dagspass (2 stk)',
    },
    {
      id: '19',
      name: 'Viking House',
      category: 'merchandise',
      website_url: 'https://www.vikinghouse.no/',
      logo_url: '/images/sponsors/viking-house.svg',
      contribution: 'VR-opplevelser (4 stk)',
    },
  ],
  trophy: [],
  donation: [],
};

export function PremierClient() {
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
                Premier og bidrag
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Premier og bidrag
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg text-muted-foreground">
              Disse bedriftene bidrar til å gjøre Barteløpet mulig og støtter
              Mental Helse Ungdom
            </p>
          </div>
        </div>
      </section>

      {/* Premier Section */}
      <section className="py-12 md:py-20 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="space-y-3 text-center mb-12">
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

            {/* Trophy Showcase */}
            <div className="max-w-3xl mx-auto mb-12">
              <div className="rounded-lg border text-card-foreground shadow-sm bg-card/50 border-accent/30 backdrop-blur relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
                <div className="p-6 md:p-8 relative">
                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    {/* Trophy Image */}
                    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border-2 border-accent/20">
                      <NextImage
                        src="/images/pokal-prototype.jpg"
                        alt="Barteløpet pokal prototype - eksklusiv pokal til alle deltakere"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    </div>
                    {/* Trophy Info */}
                    <div className="space-y-4 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 px-4 py-2 rounded-full">
                        <Trophy className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium text-accent">Pokal-prototype</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                        Prototype av pokalen!
                      </h3>
                      <p className="text-base text-muted-foreground">
                        Vi har fått laget en prototype av pokalen! 🏆 Den ferdige pokalen vil se enda bedre ut. Alle som fullfører Barteløpet får denne eksklusive pokalen levert hjem 🎉
                        <br /><br />
                        Pokalen er produsert av <strong>Metallteknikk AS</strong>, vår hovedsponsor for pokaler.
                      </p>
                      <div className="text-sm text-muted-foreground italic">
                        Pokal leveres etter at løpet er fullført og verifisert
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* First Sponsor (Pokal) - Centered */}
            {SPONSORS_DATA.merchandise.length > 0 && (
              <div className="flex justify-center mb-8">
                <div className="w-full max-w-sm">
                  <SponsorCard sponsor={SPONSORS_DATA.merchandise[0]} priority />
                </div>
              </div>
            )}

            {/* Remaining Sponsors Grid - 4 columns on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {SPONSORS_DATA.merchandise.slice(1).map((sponsor) => (
                <SponsorCard key={sponsor.id} sponsor={sponsor} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Omtale Section */}
      <section className="py-12 md:py-20 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="space-y-3 text-center mb-12">
              <div className="flex items-center gap-3 justify-center">
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

            {/* Media Mention Cards - 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {MEDIA_MENTIONS.map((mention) => (
                <a
                  key={mention.id}
                  href={mention.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="rounded-lg border text-card-foreground shadow-sm bg-card/50 border-border/50 backdrop-blur hover:border-accent/50 transition-all h-full overflow-hidden">
                    {mention.screenshot_url ? (
                      <div className="flex flex-col h-full">
                        {/* Screenshot */}
                        <div className="relative w-full aspect-[16/9] bg-muted">
                          <NextImage
                            src={mention.screenshot_url}
                            alt={mention.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className={`object-cover ${mention.id === '3' ? 'object-[center_top]' : 'object-top'}`}
                          />
                        </div>
                        {/* Content */}
                        <div className="p-4 md:p-6 space-y-3 flex-1 flex flex-col">
                          <h3 className="text-lg md:text-xl font-semibold text-foreground">
                            {mention.title}
                          </h3>
                          <p className="text-sm md:text-base text-muted-foreground flex-1">
                            {mention.source}
                          </p>
                          <div className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors">
                            <span className="text-sm">Se innlegg</span>
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
                    ) : (
                      <div className="p-4 md:p-6 space-y-3 text-center">
                        {mention.logo_url && (
                          <div className="relative w-full h-12 mb-2">
                            <NextImage
                              src={mention.logo_url}
                              alt={`${mention.source} logo`}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-contain"
                            />
                          </div>
                        )}
                        <h3 className="text-lg md:text-xl font-semibold text-foreground">
                          {mention.title}
                        </h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          {mention.source}
                        </p>
                        <div className="flex items-center justify-center gap-2 text-accent hover:text-accent/80 transition-colors">
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
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Donasjoner Section - Only show if there are donation sponsors */}
      {SPONSORS_DATA.donation.length > 0 && (
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              {/* Section Header */}
              <div className="space-y-3 text-center mb-12">
                <div className="flex items-center gap-3 justify-center">
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

              {/* Donation Sponsors + Spleis CTA - 3 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {/* Donation Sponsors */}
                {SPONSORS_DATA.donation.map((sponsor) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} />
                ))}

                {/* Spleis CTA Card */}
                <a
                  href={SPLEIS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="rounded-lg border text-card-foreground shadow-sm bg-card/50 border-border/50 backdrop-blur hover:border-accent/50 transition-all h-full">
                    <div className="p-4 md:p-6 space-y-3 text-center flex flex-col justify-center h-full">
                      <h3 className="text-lg md:text-xl font-semibold text-foreground">
                        Vil du bidra?
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Støtt Barteløpet og Mental Helse Ungdom gjennom vår spleis
                      </p>
                      <div className="flex items-center justify-center gap-2 text-accent hover:text-accent/80 transition-colors">
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
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="border-t border-border/50 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Interessert i å bidra til Barteløpet?
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
