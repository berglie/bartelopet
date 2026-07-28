'use client';

import { useMemo, useState } from 'react';
import { RunDetailDialog, type RunnerSummary } from '@/app/_components/run-detail-dialog';
import type { PublicRun, TicketTotals } from '@/app/_shared/types/event-2026';
import { qualifyingCategories } from '@/app/_shared/types/event-2026';

interface BartelineProps {
  runs: PublicRun[];
  tickets: TicketTotals;
}

const bands = [
  { key: 'short' as const, label: '0–10 km', start: 0, end: 10, color: 'bg-accent/40' },
  { key: 'medium' as const, label: '10–30 km', start: 10, end: 30, color: 'bg-secondary/35' },
  {
    key: 'long' as const,
    label: '30+ km',
    start: 30,
    end: null,
    color: 'bg-[#ebe5d8]',
  },
];

const ticketLabels = {
  short: '0–10 km',
  medium: '10–30 km',
  long: '30+ km',
};

export function Barteline({ runs, tickets }: BartelineProps) {
  const [selectedRun, setSelectedRun] = useState<PublicRun | null>(null);
  const runnerSummaries = useMemo(() => {
    const summaries = new Map<string, RunnerSummary>();

    for (const run of runs) {
      const summary = summaries.get(run.participant_id) || {
        runs: 0,
        kilometers: 0,
        tickets: { short: 0, medium: 0, long: 0 },
      };

      summary.runs++;
      summary.kilometers += run.distance_km;
      for (const category of qualifyingCategories(run.distance_km)) {
        if (run.interest_categories.includes(category)) summary.tickets[category]++;
      }
      summaries.set(run.participant_id, summary);
    }

    return summaries;
  }, [runs]);
  const maximum = Math.max(
    50,
    Math.ceil(Math.max(0, ...runs.map((run) => run.distance_km)) / 10) * 10
  );
  const ticks = Array.from({ length: Math.floor(maximum / 10) + 1 }, (_, index) => index * 10);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        {bands.map((band) => (
          <div
            key={band.key}
            className={`border-2 border-foreground p-3 text-center ${band.color}`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider">{band.label}</div>
            <div className="font-display text-3xl font-black">{tickets[band.key]}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              lodd
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto border-2 border-foreground bg-card p-4">
        <div className="relative h-72 min-w-[720px]" aria-label="Registrerte turer etter distanse">
          {bands.map((band) => {
            const left = (band.start / maximum) * 100;
            const right = band.end === null ? 100 : Math.min(100, (band.end / maximum) * 100);
            return (
              <div
                key={band.key}
                className={`absolute bottom-8 top-0 border-r ${band.color}`}
                style={{ left: `${left}%`, width: `${right - left}%` }}
              >
                <span className="absolute left-2 top-2 text-xs font-semibold">{band.label}</span>
              </div>
            );
          })}

          {ticks.map((tick) => (
            <div
              key={tick}
              className="absolute bottom-0 top-0 border-l border-dashed border-border/70"
              style={{ left: `${(tick / maximum) * 100}%` }}
            >
              <span className="absolute bottom-0 -translate-x-1/2 text-xs text-muted-foreground">
                {tick} km
              </span>
            </div>
          ))}

          {runs.map((run, index) => {
            const left = Math.min(99, (run.distance_km / maximum) * 100);
            const lane = index % 7;
            const showTooltipBelow = lane >= 4;
            const tooltipHorizontalPosition =
              left < 16 ? 'left-1/2' : left > 84 ? 'right-1/2' : 'left-1/2 -translate-x-1/2';
            const categories = qualifyingCategories(run.distance_km).filter((category) =>
              run.interest_categories.includes(category)
            );
            return (
              <button
                key={run.id}
                type="button"
                className="group absolute z-10 h-6 w-6 -translate-x-1/2 rounded-full hover:z-20 focus:z-20 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                style={{ left: `${left}%`, bottom: `${52 + lane * 24}px` }}
                aria-label={`Se turen til ${run.full_name}, ${run.distance_km} kilometer`}
                onClick={() => setSelectedRun(run)}
              >
                <span className="pointer-events-none absolute inset-1 rounded-full border-2 border-foreground bg-secondary shadow-md transition-transform group-hover:scale-150 group-focus:scale-150" />
                <span
                  className={`pointer-events-none absolute hidden w-56 rounded-lg border bg-popover p-3 text-left text-xs text-popover-foreground shadow-xl group-hover:block group-focus:block ${tooltipHorizontalPosition} ${
                    showTooltipBelow ? 'top-6' : 'bottom-6'
                  }`}
                >
                  <strong className="block text-sm">{run.full_name}</strong>
                  {run.title && <span className="block">{run.title}</span>}
                  <span className="block">
                    {run.run_date} · {run.distance_km.toLocaleString('nb-NO')} km
                  </span>
                  <span className="block text-muted-foreground">
                    Lodd:{' '}
                    {categories.length > 0
                      ? categories.map((category) => ticketLabels[category]).join(', ')
                      : 'ingen'}
                  </span>
                  <span className="mt-1 block font-semibold text-secondary">
                    Trykk for å se turen
                  </span>
                </span>
              </button>
            );
          })}

          {runs.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              De første prikkene dukker opp når novemberløpene registreres.
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs font-semibold text-muted-foreground">
        Trykk på en løper for å se turen, bilder og opptjente lodd.
      </p>

      <RunDetailDialog
        run={selectedRun}
        summary={selectedRun ? runnerSummaries.get(selectedRun.participant_id) || null : null}
        onOpenChange={(open) => {
          if (!open) setSelectedRun(null);
        }}
      />
    </div>
  );
}
