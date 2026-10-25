export interface DaysActiveRunner {
  id: string;
  full_name: string;
  bib_number: number;
  days: number;
}

const GROUPS_SHOWN = 5;
const NAMES_PER_GROUP = 12;

/**
 * Runners grouped by how many days they have been out. Grouping instead of numbered places
 * means everyone with the same count shares the spot.
 */
export function DaysActive({
  runners,
  daysElapsed,
}: {
  runners: DaysActiveRunner[];
  daysElapsed: number;
}) {
  const groups = new Map<number, DaysActiveRunner[]>();
  for (const runner of runners) {
    if (runner.days === 0) continue;
    groups.set(runner.days, [...(groups.get(runner.days) || []), runner]);
  }
  const shown = [...groups.entries()].sort(([a], [b]) => b - a).slice(0, GROUPS_SHOWN);

  if (shown.length === 0) return null;

  return (
    <section aria-labelledby="dager-ute">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Flest dager ute</p>
          <h2
            id="dager-ute"
            className="font-display mt-2 text-4xl font-black uppercase md:text-5xl"
          >
            Ofte slår langt.
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted-foreground md:text-right">
          Her teller ikke hvor langt du løp, bare at du kom deg ut. Tre kilometer er like mye verdt
          som tre mil, og alle med like mange dager deler plassen.
        </p>
      </div>

      <ol className="border-2 border-foreground bg-card shadow-[7px_7px_0_hsl(var(--foreground))]">
        {shown.map(([days, group], index) => {
          const names = [...group].sort((a, b) => a.bib_number - b.bib_number);
          const hidden = names.length - NAMES_PER_GROUP;
          return (
            <li
              key={days}
              className="grid gap-3 border-b border-foreground/25 p-4 last:border-0 sm:grid-cols-[9rem_1fr] sm:items-center md:p-5"
            >
              <p className="flex items-baseline gap-2">
                <span
                  className={
                    index === 0
                      ? 'font-display bg-accent px-2 text-4xl font-black tabular-nums text-accent-foreground'
                      : 'font-display text-4xl font-black tabular-nums'
                  }
                >
                  {days}
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {days === 1 ? 'dag' : 'dager'}
                  {daysElapsed > 0 && ` av ${daysElapsed}`}
                </span>
              </p>
              <ul className="flex flex-wrap gap-2">
                {names.slice(0, NAMES_PER_GROUP).map((runner) => (
                  <li
                    key={runner.id}
                    className="inline-flex items-center gap-2 border border-foreground px-2 py-1 text-sm font-bold"
                  >
                    <span className="font-mono text-[11px] text-muted-foreground">
                      #{runner.bib_number}
                    </span>
                    {runner.full_name}
                  </li>
                ))}
                {hidden > 0 && (
                  <li className="px-2 py-1 text-sm text-muted-foreground">og {hidden} til</li>
                )}
              </ul>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
