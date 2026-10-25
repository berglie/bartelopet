'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  type DistanceCategorySlug,
} from '@/app/_shared/types/event-2026';
import { cn } from '@/app/_shared/lib/utils/cn';

export interface ParticipantRow {
  id: string;
  full_name: string;
  bib_number: number;
  runs: number;
  km: number;
  short: number;
  medium: number;
  long: number;
}

type SortKey = 'bib_number' | 'runs' | 'km' | DistanceCategorySlug;

/** Start numbers read best ascending, everything else highest first. Ties fall back to bib. */
function sortRows(rows: ParticipantRow[], key: SortKey): ParticipantRow[] {
  return [...rows].sort((a, b) =>
    key === 'bib_number'
      ? a.bib_number - b.bib_number
      : b[key] - a[key] || a.bib_number - b.bib_number
  );
}

export function ParticipantsTable({ rows }: { rows: ParticipantRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('bib_number');
  const sorted = sortRows(rows, sortKey);

  const sortButton = (key: SortKey, children: React.ReactNode, align = 'justify-end') => {
    const active = sortKey === key;
    const Icon = key === 'bib_number' ? ArrowUp : ArrowDown;
    return (
      <button
        type="button"
        onClick={() => setSortKey(key)}
        className={cn(
          'inline-flex w-full items-center gap-1.5 uppercase hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          align
        )}
      >
        {children}
        <Icon className={cn('h-3 w-3', !active && 'opacity-0')} aria-hidden="true" />
      </button>
    );
  };
  const ariaSort = (key: SortKey) =>
    sortKey === key ? (key === 'bib_number' ? 'ascending' : 'descending') : undefined;

  return (
    <table className="w-full min-w-[680px] text-left text-sm">
      <caption className="sr-only">
        Påmeldte løpere med turer, kilometer og lodd per premiekategori. Trykk på en
        kolonneoverskrift for å sortere.
      </caption>
      <thead className="border-b-2 border-foreground bg-foreground text-[11px] font-black uppercase tracking-[0.14em] text-background">
        <tr>
          <th
            scope="col"
            aria-sort={ariaSort('bib_number')}
            className="sticky left-0 z-10 bg-foreground p-4"
          >
            {sortButton('bib_number', 'Løper', 'justify-start')}
          </th>
          <th scope="col" aria-sort={ariaSort('runs')} className="p-4 text-right">
            {sortButton('runs', 'Turer')}
          </th>
          <th scope="col" aria-sort={ariaSort('km')} className="p-4 text-right">
            {sortButton('km', 'Km')}
          </th>
          {CATEGORY_ORDER.map((slug) => (
            <th key={slug} scope="col" aria-sort={ariaSort(slug)} className="p-4 text-center">
              {sortButton(
                slug,
                <span
                  className={cn(
                    'inline-block border border-background/40 px-2 py-0.5',
                    CATEGORY_META[slug].solid
                  )}
                >
                  {CATEGORY_META[slug].range.replace(' km', '')}
                </span>,
                'justify-center'
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => (
          <tr
            key={row.id}
            className="group border-b border-foreground/25 tabular-nums last:border-0"
          >
            <th
              scope="row"
              className="sticky left-0 z-10 bg-card p-4 text-left font-bold group-hover:bg-muted"
            >
              <span className="mr-3 inline-flex min-w-12 justify-center bg-foreground px-2 py-1 font-mono text-xs text-background">
                #{row.bib_number}
              </span>
              {row.full_name}
            </th>
            <td className="p-4 text-right group-hover:bg-muted">{row.runs}</td>
            <td className="p-4 text-right group-hover:bg-muted">
              {row.km.toLocaleString('nb-NO', { maximumFractionDigits: 1 })}
            </td>
            {CATEGORY_ORDER.map((slug) => (
              <td
                key={slug}
                className={cn(
                  'p-4 text-center font-black group-hover:bg-muted',
                  row[slug] === 0 && 'font-normal text-muted-foreground'
                )}
              >
                {row[slug]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
