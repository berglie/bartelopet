'use client';

import { useMemo, useState } from 'react';
import { RunDetailDialog } from '@/app/_components/run-detail-dialog';
import type { PublicRun } from '@/app/_shared/types/event-2026';
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  qualifyingCategories,
  summarizeRunners,
  ticketsForRun,
} from '@/app/_shared/types/event-2026';
import { formatDate } from '@/app/_shared/lib/utils/format';

interface BartelineProps {
  runs: PublicRun[];
}

const bandStart = { short: 0, medium: 10, long: 30 } as const;
const bandEnd = { short: 10, medium: 30, long: null } as const;

const LANE_HEIGHT = 24;
const MAX_LANES = 10;
const AXIS_HEIGHT = 32;
const LABEL_SPACE = 40;
// Minimum horizontal gap (as a share of the axis) before two dots may share a lane.
const DOT_SPACING = 0.035;

export function Barteline({ runs }: BartelineProps) {
  const [selectedRun, setSelectedRun] = useState<PublicRun | null>(null);
  const runnerSummaries = useMemo(() => summarizeRunners(runs), [runs]);
  const maximum = Math.max(
    50,
    Math.ceil(Math.max(0, ...runs.map((run) => run.distance_km)) / 10) * 10
  );
  const ticks = Array.from({ length: Math.floor(maximum / 10) + 1 }, (_, index) => index * 10);

  // Stack dots bottom-up so runs of similar distance pile into columns instead of overlapping.
  const { placed, laneCount } = useMemo(() => {
    const minimumGap = maximum * DOT_SPACING;
    const laneEnds: number[] = [];
    const placed = [...runs]
      .sort((a, b) => a.distance_km - b.distance_km)
      .map((run) => {
        let lane = laneEnds.findIndex((end) => run.distance_km - end >= minimumGap);
        if (lane === -1) {
          lane = laneEnds.length;
          laneEnds.push(run.distance_km);
        } else {
          laneEnds[lane] = run.distance_km;
        }
        return { run, lane: lane % MAX_LANES };
      });
    return { placed, laneCount: Math.min(Math.max(laneEnds.length, 1), MAX_LANES) };
  }, [runs, maximum]);

  const chartHeight = AXIS_HEIGHT + LABEL_SPACE + 16 + Math.max(laneCount, 5) * LANE_HEIGHT;
  const plotHeight = chartHeight - AXIS_HEIGHT;

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="overflow-x-auto border-2 border-foreground bg-card p-4 text-foreground [scrollbar-width:thin]">
          <div
            className="relative min-w-[600px] md:min-w-0"
            style={{ height: chartHeight }}
            role="group"
            aria-label="Registrerte turer etter distanse"
          >
            {CATEGORY_ORDER.map((slug) => {
              const start = bandStart[slug];
              const end = bandEnd[slug];
              const left = (start / maximum) * 100;
              const right = end === null ? 100 : Math.min(100, (end / maximum) * 100);
              return (
                <div
                  key={slug}
                  className={`absolute top-0 border-r border-foreground/40 ${CATEGORY_META[slug].soft}`}
                  style={{ left: `${left}%`, width: `${right - left}%`, bottom: AXIS_HEIGHT }}
                >
                  <span className="absolute left-2 top-2 text-[11px] font-black uppercase tracking-[0.12em]">
                    {CATEGORY_META[slug].range}
                  </span>
                </div>
              );
            })}

            {ticks.map((tick, index) => (
              <div
                key={tick}
                className="absolute top-0 border-l border-dashed border-foreground/25"
                style={{ left: `${(tick / maximum) * 100}%`, bottom: AXIS_HEIGHT - 6 }}
              >
                <span
                  className={`absolute top-full whitespace-nowrap pt-1 text-xs tabular-nums text-muted-foreground ${
                    index === 0
                      ? 'left-0'
                      : index === ticks.length - 1
                        ? 'right-0'
                        : '-translate-x-1/2'
                  }`}
                >
                  {tick} km
                </span>
              </div>
            ))}

            {placed.map(({ run, lane }) => {
              const left = Math.min(99, (run.distance_km / maximum) * 100);
              const bottom = AXIS_HEIGHT + 8 + lane * LANE_HEIGHT;
              const showTooltipBelow = bottom > plotHeight / 2;
              const tooltipHorizontalPosition =
                left < 20 ? 'left-1/2' : left > 80 ? 'right-1/2' : 'left-1/2 -translate-x-1/2';
              const categories = qualifyingCategories(run.distance_km).filter((category) =>
                run.interest_categories.includes(category)
              );
              return (
                <button
                  key={run.id}
                  type="button"
                  className="group absolute z-10 h-6 w-6 -translate-x-1/2 rounded-full hover:z-20 focus:z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
                  style={{ left: `${left}%`, bottom }}
                  aria-label={`Se turen til ${run.full_name}, ${run.distance_km.toLocaleString('nb-NO')} kilometer`}
                  onClick={() => setSelectedRun(run)}
                >
                  <span className="pointer-events-none absolute inset-1 rounded-full border-2 border-foreground bg-secondary transition-transform group-hover:scale-150 group-focus-visible:scale-150" />
                  <span
                    className={`pointer-events-none absolute hidden w-56 border-2 border-foreground bg-popover p-3 text-left text-xs text-popover-foreground shadow-[4px_4px_0_hsl(var(--foreground))] group-hover:block group-focus-visible:block ${tooltipHorizontalPosition} ${
                      showTooltipBelow ? 'top-7' : 'bottom-7'
                    }`}
                  >
                    <strong className="block text-sm">{run.full_name}</strong>
                    {run.title && <span className="block">{run.title}</span>}
                    <span className="block tabular-nums">
                      {formatDate(run.run_date, { year: undefined })} ·{' '}
                      {run.distance_km.toLocaleString('nb-NO')} km
                    </span>
                    <span className="block text-muted-foreground">
                      {categories.length > 0
                        ? `${ticketsForRun(run.distance_km)} lodd i ${categories
                            .map((category) => CATEGORY_META[category].range)
                            .join(', ')}`
                        : 'Ingen lodd'}
                    </span>
                    <span className="mt-1 block font-bold underline decoration-secondary decoration-2 underline-offset-2">
                      Trykk for å se turen
                    </span>
                  </span>
                </button>
              );
            })}

            {runs.length === 0 && (
              <div
                className="absolute inset-x-0 top-0 flex items-center justify-center px-6 text-center text-sm font-semibold"
                style={{ bottom: AXIS_HEIGHT }}
              >
                <span className="border-2 border-foreground bg-card px-4 py-2">
                  De første prikkene dukker opp når novemberløpene registreres.
                </span>
              </div>
            )}
          </div>
        </div>
        {/* Scroll affordance for narrow screens where the axis is wider than the card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-[2px] right-[2px] w-10 bg-gradient-to-l from-card to-transparent md:hidden"
        />
      </div>

      {runs.length > 0 && (
        <p className="text-center text-xs font-semibold text-background/70">
          <span className="md:hidden">Sveip for å se hele linjen. </span>
          Trykk på en prikk for å se turen, bilder og opptjente lodd.
        </p>
      )}

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
