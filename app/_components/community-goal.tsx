import { Check, MapPin } from 'lucide-react';
import { COMMUNITY_GOAL_STOPS } from '@/app/_shared/types/event-2026';
import { cn } from '@/app/_shared/lib/utils/cn';

const formatKm = (km: number) => km.toLocaleString('nb-NO', { maximumFractionDigits: 0 });

/**
 * The field's total km as a trip from Stavanger. Made for dark sections. Leave out the total
 * where it is already shown, and the headline becomes the distance left instead.
 */
export function CommunityGoal({
  kilometers,
  showTotal = true,
  className,
}: {
  kilometers: number;
  showTotal?: boolean;
  className?: string;
}) {
  const next = COMMUNITY_GOAL_STOPS.find((stop) => stop.km > kilometers);
  const previousKm = [...COMMUNITY_GOAL_STOPS].reverse().find((stop) => stop.km <= kilometers)?.km;
  const from = previousKm ?? 0;
  const progress = next ? ((kilometers - from) / (next.km - from)) * 100 : 100;
  const lastStop = COMMUNITY_GOAL_STOPS[COMMUNITY_GOAL_STOPS.length - 1];

  return (
    <div className={cn('border-2 border-background/30 p-5 md:p-7', className)}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-background/70">
        Felles mål · fra Stavanger
      </p>
      <p className="font-display mt-2 text-5xl font-black tabular-nums text-accent md:text-6xl">
        {showTotal || !next
          ? `${formatKm(kilometers)} km`
          : `${formatKm(next.km - kilometers)} km igjen`}
      </p>
      <p className="mt-1 text-sm text-background/75">
        {!next
          ? `løpt sammen. Vi har nådd ${lastStop.place} – alt videre er bonus.`
          : showTotal
            ? `løpt sammen. ${formatKm(next.km - kilometers)} km igjen til ${next.place}.`
            : `til vi sammen har løpt til ${next.place}. Hver tur flytter oss nærmere.`}
      </p>

      <div
        role="progressbar"
        aria-label={next ? `Mot ${next.place}` : `${lastStop.place} er nådd`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        className="mt-5 h-4 border-2 border-background bg-background/10"
      >
        <div
          className="h-full origin-left animate-grow-x bg-accent"
          style={{ width: `${Math.max(progress, 1)}%` }}
        />
      </div>

      <ol className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {COMMUNITY_GOAL_STOPS.map((stop) => {
          const reached = stop.km <= kilometers;
          const Icon = reached ? Check : MapPin;
          return (
            <li
              key={stop.place}
              className={cn(
                'flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em]',
                reached ? 'text-accent' : 'text-background/60',
                stop === next && 'text-background'
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {stop.place}
              <span className="font-normal normal-case tabular-nums tracking-normal">
                {formatKm(stop.km)} km
              </span>
              {reached && <span className="sr-only">(nådd)</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
