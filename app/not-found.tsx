import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';
import { Button } from '@/app/_shared/components/ui/button';
import { TerrainLines } from '@/app/_shared/components/terrain-lines';

export const metadata: Metadata = {
  title: 'Fant ikke siden',
};

export default function NotFound() {
  return (
    <section className="relative isolate overflow-hidden border-b-2 border-foreground bg-foreground text-background">
      <TerrainLines animated className="text-accent/20" />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-3 w-full origin-left animate-grow-x bg-accent"
        style={{ animationDelay: '600ms' }}
      />

      <div className="relative mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-[1500px] flex-col justify-center px-4 py-16 md:px-8">
        <span className="inline-flex animate-fade-up items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
          <Compass className="h-4 w-4" aria-hidden="true" />
          Feil 404 · Siden finnes ikke
        </span>

        <h1 className="font-display mt-6 text-[clamp(4rem,11vw,9.5rem)] font-black uppercase leading-[0.8] tracking-[-0.02em]">
          <span className="block animate-rise" style={{ animationDelay: '150ms' }}>
            Her er det
          </span>
          <span className="block animate-rise text-accent" style={{ animationDelay: '280ms' }}>
            ingen løype.
          </span>
        </h1>

        <p
          className="mt-8 max-w-2xl animate-fade-up text-xl leading-relaxed text-background/80 md:text-2xl"
          style={{ animationDelay: '450ms' }}
        >
          Du har visst løpt litt for langt. Siden du leter etter er flyttet, slettet eller har aldri
          eksistert.
        </p>

        <div
          className="mt-10 animate-fade-up border-t border-background/25 pt-6"
          style={{ animationDelay: '600ms' }}
        >
          <Button asChild variant="cta-dark" size="xl" className="group">
            <Link href="/">
              Tilbake til start
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
