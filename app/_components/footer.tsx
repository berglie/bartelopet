'use client';

import Link from 'next/link';
import { useYear } from '@/contexts/year-context';
import { ArrowUpRight } from 'lucide-react';
import { PROJECT_SUT_URL } from '@/app/_shared/lib/constants/config';

export function Footer() {
  const { selectedYear } = useYear();

  const archiveHref = (path: string) => `${path}?year=2025`;

  if (selectedYear === 2025) {
    return (
      <footer className="mt-16 border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2025 ÅpenAid - Støtter mental helse gjennom Movember
            </p>
            <div className="flex gap-4 text-sm">
              <Link
                href={archiveHref('/kontakt')}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Kontakt
              </Link>
              <Link
                href={archiveHref('/vilkar')}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Vilkår for bruk
              </Link>
              <Link
                href={archiveHref('/personvern')}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Personvern
              </Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t-2 border-foreground bg-foreground text-background">
      <div className="mx-auto max-w-[1500px] px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="font-display text-4xl font-black uppercase leading-none">Barteløpet</p>
            <p className="mt-3 max-w-sm text-sm text-background/70">
              Løp hvor du vil i november. Hver kilometer støtter fellesskap og mestring gjennom
              Prosjekt SUT.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Utforsk
            </p>
            <div className="grid gap-2 text-sm">
              <Link href="/pamelding" className="hover:text-accent">
                Meld deg på
              </Link>
              <Link href="/#bartelinjen" className="hover:text-accent">
                Bartelinjen
              </Link>
              <Link href="/deltakere" className="hover:text-accent">
                Løpere
              </Link>
              <Link href="/premier" className="hover:text-accent">
                Premier
              </Link>
              <a
                href={PROJECT_SUT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-accent"
              >
                Prosjekt SUT <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">
              Praktisk
            </p>
            <div className="grid gap-2 text-sm">
              <Link href="/kontakt" className="hover:text-accent">
                Kontakt
              </Link>
              <Link href="/vilkar" className="hover:text-accent">
                Vilkår for bruk
              </Link>
              <Link href="/personvern" className="hover:text-accent">
                Personvern
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-background/25 pt-5 text-xs uppercase tracking-[0.12em] text-background/60 sm:flex-row">
          <p>© {selectedYear} ÅpenAid</p>
          <Link href={archiveHref('/')} className="hover:text-accent">
            Se Barteløpet 2025 →
          </Link>
        </div>
      </div>
    </footer>
  );
}
