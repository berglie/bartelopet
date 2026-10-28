'use client';

import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Footprints,
  Hash,
  ImageIcon,
  MessageCircle,
  Route,
  TicketCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/_shared/components/ui/dialog';
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  qualifyingCategories,
  ticketsForRun,
  type PublicRun,
  type RunnerSummary,
} from '@/app/_shared/types/event-2026';
import { cn } from '@/app/_shared/lib/utils/cn';

interface RunDetailDialogProps {
  run: PublicRun | null;
  summary: RunnerSummary | null;
  onOpenChange: (open: boolean) => void;
}

function getSafeEvidenceUrl(url: string | null) {
  if (!url) return null;
  // Local paths (demo data) only; protocol-relative '//host' would leave the site.
  if (url.startsWith('/')) return /^\/[^/\\]/.test(url) ? url : null;

  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol) ? parsedUrl.toString() : null;
  } catch {
    return null;
  }
}

export function RunDetailDialog({ run, summary, onOpenChange }: RunDetailDialogProps) {
  if (!run || !summary) return null;

  const earnedCategories = qualifyingCategories(run.distance_km).filter((category) =>
    run.interest_categories.includes(category)
  );
  const totalTickets = Object.values(summary.tickets).reduce((total, count) => total + count, 0);
  const evidenceUrl = getSafeEvidenceUrl(run.evidence_url);
  // Only photos uploaded to our own bucket are shown inline (next/image only allows that host).
  // Every other link opens as a plain link.
  const evidenceIsImage = Boolean(
    evidenceUrl &&
    (evidenceUrl.startsWith('/') ||
      evidenceUrl.startsWith(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/run-evidence/`
      ))
  );

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] gap-0 overflow-y-auto border-2 border-foreground p-0 shadow-[8px_8px_0_hsl(var(--secondary))] sm:max-w-2xl sm:rounded-none [&>button]:border [&>button]:border-foreground [&>button]:bg-accent [&>button]:p-1 [&>button]:text-foreground [&>button]:opacity-100">
        <DialogHeader className="border-b-2 border-foreground bg-foreground p-5 pr-12 text-left text-background sm:p-7 sm:pr-14">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-accent">
            <span className="inline-flex items-center gap-1.5 border border-accent px-2 py-1">
              <Hash className="h-3 w-3" />
              {run.bib_number}
            </span>
            <span>
              {summary.runs === 1 ? '1 registrert tur' : `${summary.runs} registrerte turer`}
            </span>
            {run.on_barteloypa && (
              <span className="border border-accent bg-accent px-2 py-1 text-accent-foreground">
                Barteløypa
              </span>
            )}
          </div>
          <DialogTitle className="font-display mt-3 text-4xl font-black uppercase leading-none sm:text-5xl">
            {run.full_name}
          </DialogTitle>
          <DialogDescription className="text-sm text-background/75">
            Løperens totalsummer og den valgte turen.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 border-b-2 border-foreground">
          <div className="border-r border-foreground p-3 sm:p-4">
            <Route className="mb-2 h-4 w-4 text-secondary" />
            <p className="font-display text-2xl font-black sm:text-3xl">{summary.runs}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Turer
            </p>
          </div>
          <div className="border-r border-foreground p-3 sm:p-4">
            <Footprints className="mb-2 h-4 w-4 text-secondary" />
            <p className="font-display text-2xl font-black sm:text-3xl">
              {summary.kilometers.toLocaleString('nb-NO', { maximumFractionDigits: 1 })}
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              Kilometer
            </p>
          </div>
          <div className="bg-accent p-3 sm:p-4">
            <TicketCheck className="mb-2 h-4 w-4" />
            <p className="font-display text-2xl font-black sm:text-3xl">{totalTickets}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.12em]">Lodd totalt</p>
          </div>
        </div>

        <div className="border-b-2 border-foreground bg-muted/40 px-5 py-3 sm:px-7">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {CATEGORY_ORDER.map((category) => (
              <div key={category} className="flex items-center gap-1.5 text-xs">
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-2.5 w-2.5 border border-foreground',
                    CATEGORY_META[category].solid
                  )}
                />
                <span className="font-black tabular-nums">{summary.tickets[category]}</span>
                <span className="text-muted-foreground">{CATEGORY_META[category].range}</span>
              </div>
            ))}
          </div>
        </div>

        <article className="space-y-5 p-5 sm:p-7">
          <div>
            <p className="eyebrow text-[11px]">Valgt tur</p>
            <h3 className="font-display mt-2 text-3xl font-black uppercase leading-none sm:text-4xl">
              {run.title || 'Løpetur'}
            </h3>
          </div>

          {evidenceIsImage && evidenceUrl && (
            <a
              href={evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-[4/3] overflow-hidden border-2 border-foreground bg-muted"
              aria-label="Åpne bildet i full størrelse"
            >
              <Image
                src={evidenceUrl}
                alt={`Bilde fra ${run.full_name} sin tur`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, 672px"
              />
              <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 border border-foreground bg-background px-2 py-1 text-[10px] font-black uppercase tracking-wide">
                <ImageIcon className="h-3 w-3" />
                Se hele
              </span>
            </a>
          )}

          <div className="grid grid-cols-2 gap-px border-2 border-foreground bg-foreground sm:grid-cols-4">
            <RunFact
              icon={CalendarDays}
              label="Dato"
              value={format(parseISO(run.run_date), 'd. MMMM', { locale: nb })}
            />
            <RunFact
              icon={Footprints}
              label="Distanse"
              value={`${run.distance_km.toLocaleString('nb-NO')} km`}
            />
            <RunFact icon={Clock3} label="Tid" value={run.duration_text || 'Ikke oppgitt'} />
            <RunFact
              icon={TicketCheck}
              label="Lodd per kategori"
              value={String(ticketsForRun(run.distance_km))}
            />
          </div>

          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              Lodd fra denne turen
            </p>
            <div className="flex flex-wrap gap-2">
              {earnedCategories.length > 0 ? (
                earnedCategories.map((category) => (
                  <span
                    key={category}
                    className={cn(
                      'inline-flex items-center gap-1.5 border-2 border-foreground px-2.5 py-1 text-xs font-black',
                      CATEGORY_META[category].solid
                    )}
                  >
                    <TicketCheck className="h-3.5 w-3.5" />
                    {ticketsForRun(run.distance_km)} × {CATEGORY_META[category].range}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  Ingen valgte premiekategorier kvalifisert.
                </span>
              )}
            </div>
          </div>

          {run.comment && (
            <div className="border-l-4 border-secondary bg-muted/50 p-4">
              <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                <MessageCircle className="h-3.5 w-3.5" />
                Fra løperen
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{run.comment}</p>
            </div>
          )}

          {evidenceUrl && !evidenceIsImage && (
            <a
              href={evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border-b-2 border-foreground pb-1 text-sm font-black uppercase tracking-[0.12em] hover:border-secondary hover:text-secondary-ink"
            >
              Se aktivitet
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </article>
      </DialogContent>
    </Dialog>
  );
}

function RunFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 bg-card p-3">
      <Icon className="mb-2 h-4 w-4 text-secondary" />
      <p className="truncate text-sm font-black">{value}</p>
      <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
