'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { RunDetailDialog } from '@/app/_components/run-detail-dialog';
import type { PublicRun, RunnerSummary } from '@/app/_shared/types/event-2026';
import { formatDate } from '@/app/_shared/lib/utils/format';

export interface RecentRun {
  run: PublicRun;
  summary: RunnerSummary;
}

export function RecentRuns({ items }: { items: RecentRun[] }) {
  const [selected, setSelected] = useState<RecentRun | null>(null);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="siste-turer">
      <div className="mb-6">
        <p className="eyebrow">Fra feltet</p>
        <h2
          id="siste-turer"
          className="font-display mt-2 text-4xl font-black uppercase md:text-5xl"
        >
          Siste turer
        </h2>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.run.id}>
            <button
              type="button"
              onClick={() => setSelected(item)}
              className="flex h-full w-full flex-col border-2 border-foreground bg-card p-5 text-left transition-[transform,box-shadow] duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_hsl(var(--secondary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center justify-between gap-3 text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                {formatDate(item.run.run_date, { year: undefined, timeZone: 'UTC' })}
                <span className="font-display text-2xl tabular-nums text-foreground">
                  {item.run.distance_km.toLocaleString('nb-NO')} km
                </span>
              </span>
              <span className="font-display mt-3 text-2xl font-black uppercase leading-none">
                {item.run.title || 'Løpetur'}
              </span>
              <span className="mt-2 text-sm font-bold">
                <span className="mr-2 font-mono text-[11px] text-muted-foreground">
                  #{item.run.bib_number}
                </span>
                {item.run.full_name}
              </span>
              {item.run.comment && (
                <span className="mt-3 flex gap-2 border-l-4 border-secondary pl-3 text-sm text-muted-foreground">
                  <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="line-clamp-2">{item.run.comment}</span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <RunDetailDialog
        run={selected?.run ?? null}
        summary={selected?.summary ?? null}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </section>
  );
}
