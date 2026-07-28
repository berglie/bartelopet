'use client';

import { RegistrationForm } from '@/app/pamelding/_components/registration-form';
import { Card, CardContent } from '@/app/_shared/components/ui/card';
import { EditRestrictionGuard, ReadOnlyBanner } from './_components/edit-restriction-guard';
import { getCurrentEventYear } from '@/app/_shared/lib/utils/year';
import { TerrainLines } from '@/app/_shared/components/terrain-lines';
import { HeartHandshake, Route, TicketCheck } from 'lucide-react';

const steps = [
  {
    icon: Route,
    title: 'Meld deg på',
    text: 'Få startnummer og velg hvilke premiedistanser du er interessert i.',
  },
  {
    icon: HeartHandshake,
    title: 'Løp og doner',
    text: 'Velg din egen novembertur og doner minst 5 kroner per kilometer.',
  },
  {
    icon: TicketCheck,
    title: 'Registrer turen',
    text: 'Legg turen på Min side og samle lodd i kategoriene du kvalifiserer til.',
  },
];

export default function SubmitPage() {
  const currentYear = getCurrentEventYear();

  return (
    <div>
      <header className="relative overflow-hidden border-b-2 border-foreground bg-foreground py-16 text-background md:py-24">
        <TerrainLines className="text-accent/20" />
        <div className="relative mx-auto max-w-[1500px] px-4 md:px-8">
          <p className="inline-flex border border-accent bg-accent px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-accent-foreground">
            Barteløpet {currentYear}
          </p>
          <h1 className="font-display mt-5 text-7xl font-black uppercase leading-[0.82] md:text-9xl">
            Finn din
            <span className="block text-accent">startlinje.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-background/65">
            Påmeldingen er gratis. Du bestemmer selv hvor langt og hvor du vil løpe.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
        <aside className="space-y-6 lg:sticky lg:top-28">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-secondary">
              Kort fortalt
            </p>
            <h2 className="font-display mt-2 text-5xl font-black uppercase leading-none">
              Klar.
              <br />
              Ferdig.
              <br />
              Fellesskap.
            </h2>
          </div>
          <Card className="border-2 border-foreground bg-accent shadow-[6px_6px_0_hsl(var(--foreground))]">
            <CardContent className="space-y-6 p-6">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-foreground bg-background">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em]">
                        Steg {index + 1}
                      </p>
                      <h3 className="font-display text-2xl font-black uppercase">{step.title}</h3>
                      <p className="mt-1 text-sm text-foreground/70">{step.text}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-6">
          <ReadOnlyBanner year={currentYear} />
          <EditRestrictionGuard year={currentYear}>
            <RegistrationForm />
          </EditRestrictionGuard>
        </div>
      </main>
    </div>
  );
}
