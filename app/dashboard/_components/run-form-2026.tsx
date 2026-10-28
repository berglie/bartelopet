'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRun, updateRun, uploadRunEvidence } from '@/app/actions/runs';
import { Button } from '@/app/_shared/components/ui/button';
import { Input } from '@/app/_shared/components/ui/input';
import { Label } from '@/app/_shared/components/ui/label';
import { Textarea } from '@/app/_shared/components/ui/textarea';
import { Checkbox } from '@/app/_shared/components/ui/checkbox';
import {
  CATEGORY_META,
  donationForDistance,
  MAX_RUN_KM,
  MIN_RUN_KM,
  qualifyingCategories,
  SUGGESTED_GIFT_NOK,
  ticketsForRun,
  type RunDateRange,
} from '@/app/_shared/types/event-2026';
import type { Database } from '@/app/_shared/lib/supabase/types';
import { formatMegabytes, RUN_PHOTO_LIMITS } from '@/app/_shared/lib/constants/images';
import { SPLEIS_PROJECT_URL } from '@/app/_shared/lib/constants/config';
import { shrinkImage } from '@/app/_shared/lib/utils/shrink-image';

type Run = Database['public']['Tables']['runs']['Row'];

const MAX_ORIGINAL_MB = formatMegabytes(RUN_PHOTO_LIMITS.MAX_ORIGINAL_BYTES);
const MAX_UPLOAD_MB = formatMegabytes(RUN_PHOTO_LIMITS.MAX_UPLOAD_BYTES);

/** Shrinks the photo to fit the upload limit, or explains in Norwegian why it cannot. */
async function preparePhoto(file: File): Promise<{ file: File } | { error: string }> {
  if (!file.type.startsWith('image/')) {
    return { error: 'Filen må være et bilde (JPEG, PNG eller WebP).' };
  }
  if (file.size > RUN_PHOTO_LIMITS.MAX_ORIGINAL_BYTES) {
    return {
      error: `Bildet er ${formatMegabytes(file.size)} MB. Velg et bilde på maks ${MAX_ORIGINAL_MB} MB.`,
    };
  }

  const shrunk = await shrinkImage(file, RUN_PHOTO_LIMITS.MAX_DIMENSION);
  if (!shrunk) {
    // The browser could not read it; small files can still go to the server as they are.
    if (file.size <= RUN_PHOTO_LIMITS.MAX_UPLOAD_BYTES) return { file };
    return {
      error: `Bildet kunne ikke forminskes i nettleseren, og er for stort til å lastes opp som det er (${formatMegabytes(file.size)} MB, maks ${MAX_UPLOAD_MB} MB). Bruk JPEG, PNG eller WebP, eller ta et skjermbilde av aktiviteten.`,
    };
  }
  if (shrunk.size > RUN_PHOTO_LIMITS.MAX_UPLOAD_BYTES) {
    return {
      error: `Bildet er for stort selv etter forminsking (${formatMegabytes(shrunk.size)} MB, maks ${MAX_UPLOAD_MB} MB). Prøv et annet bilde.`,
    };
  }
  return { file: new File([shrunk], 'tur.jpg', { type: 'image/jpeg' }) };
}

/** The open dates without a run yet, latest first. One run per date is allowed. */
function freeDates(dates: RunDateRange | null, taken: string[]): string[] {
  if (!dates) return [];
  const free: string[] = [];
  const day = new Date(`${dates.max}T12:00:00Z`);
  for (let date = dates.max; date >= dates.min; date = day.toISOString().slice(0, 10)) {
    if (!taken.includes(date)) free.push(date);
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return free;
}

export function RunForm2026({
  run,
  disabled = false,
  donationUrl,
  dates,
  takenDates = [],
  totalKm = 0,
}: {
  run?: Run;
  disabled?: boolean;
  donationUrl?: string | null;
  /** Dates open for registration (today and yesterday), from the server. */
  dates: RunDateRange | null;
  /** Dates the participant already has a run on. Only used for new runs. */
  takenDates?: string[];
  /** Kilometres in the participant's saved runs. Only used for new runs. */
  totalKm?: number;
}) {
  const router = useRouter();
  const [distance, setDistance] = useState(run?.distance_km?.toString() || '');
  const [confirmed, setConfirmed] = useState(false);
  const [onBarteloypa, setOnBarteloypa] = useState(run?.on_barteloypa ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Suggested gift for all runs so far, counted when saving. Shown after saving, never as a condition.
  const [savedGift, setSavedGift] = useState<{ km: number; amount: number } | null>(null);
  const distanceKm = Number(distance);
  // A new date or distance counts as a new registration, so older runs keep both.
  const locked = !dates || Boolean(run && run.run_date < dates.min);
  const tickets = distance && Number.isFinite(distanceKm) ? ticketsForRun(distanceKm) : 0;
  // Runs saved here, by date. takenDates and totalKm only include them once router.refresh()
  // lands, so until then they are counted from this instead.
  const [savedRuns, setSavedRuns] = useState<Record<string, number>>({});
  const pendingRuns = Object.entries(savedRuns).filter(([date]) => !takenDates.includes(date));
  const knownKm = totalKm + pendingRuns.reduce((sum, [, km]) => sum + km, 0);
  const openDates = run
    ? []
    : freeDates(dates, [...takenDates, ...pendingRuns.map(([date]) => date)]);
  // After saving, the thanks replaces the fields until the participant asks for another run.
  const [showFields, setShowFields] = useState(true);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Keep a reference: React clears event.currentTarget once we await below.
    const formElement = event.currentTarget;
    setLoading(true);
    setError('');
    setSavedGift(null);
    const form = new FormData(formElement);
    // No link field any more: keep the saved link or photo unless a new photo replaces it.
    let evidenceUrl = run?.evidence_url ?? '';
    const evidenceFile = form.get('evidence_file');

    try {
      if (evidenceFile instanceof File && evidenceFile.size > 0) {
        const photo = await preparePhoto(evidenceFile);
        if ('error' in photo) {
          setError(photo.error);
          return;
        }
        // Uploaded through the server, which re-encodes the photo without location data (EXIF).
        const upload = new FormData();
        upload.append('file', photo.file);
        let uploaded: Awaited<ReturnType<typeof uploadRunEvidence>>;
        try {
          uploaded = await uploadRunEvidence(upload);
        } catch {
          // Network errors and bodies rejected by Vercel both throw here, so name both causes.
          setError(
            `Opplastingen av bildet feilet. Sjekk nettforbindelsen og prøv igjen. Hvis det fortsatt feiler, velg et annet bilde (maks ${formatMegabytes(RUN_PHOTO_LIMITS.MAX_UPLOAD_BYTES)} MB etter forminsking).`
          );
          return;
        }
        if (!uploaded.success || !uploaded.data) {
          setError(uploaded.success ? 'Opplastingen feilet. Prøv igjen.' : uploaded.error);
          return;
        }
        evidenceUrl = uploaded.data.url;
      }

      const payload = {
        // Disabled fields are left out of the form data, so a locked run keeps its own date.
        run_date: String(form.get('run_date') || run?.run_date),
        distance_km: Number(distance),
        run_confirmed: confirmed as true,
        on_barteloypa: onBarteloypa,
        title: String(form.get('title') || ''),
        // No longer asked for, but older runs keep the time they were saved with.
        duration_text: run?.duration_text ?? '',
        comment: String(form.get('comment') || ''),
        evidence_url: evidenceUrl,
      };

      const result = run ? await updateRun(run.id, payload) : await createRun(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (!run) {
        formElement.reset();
        setDistance('');
        setConfirmed(false);
        setOnBarteloypa(false);
        // Rounded so float sums like 0.1 + 0.2 do not add a krone.
        const km = Math.round((knownKm + payload.distance_km) * 100) / 100;
        setSavedGift({ km, amount: donationForDistance(km) });
        setSavedRuns((runs) => ({ ...runs, [payload.run_date]: payload.distance_km }));
        setShowFields(false);
      }
      router.refresh();
    } catch {
      setError('Noe gikk galt under lagringen. Sjekk nettforbindelsen og prøv igjen.');
    } finally {
      setLoading(false);
    }
  }

  const thanks = savedGift && (
    <div role="status" className="space-y-2 border-2 border-foreground bg-accent/40 p-4 text-sm">
      <p className="font-display text-xl font-black uppercase">Takk for turen!</p>
      <p>
        Så langt i november har du gått eller løpt{' '}
        {savedGift.km.toLocaleString('nb-NO', { maximumFractionDigits: 2 })} km. Med 5 kr per km
        tilsvarer det <strong>{savedGift.amount.toLocaleString('nb-NO')} kr</strong> til Prosjekt
        SUT.
        {savedGift.amount < SUGGESTED_GIFT_NOK &&
          ` Du kan også gi et fast beløp, for eksempel ${SUGGESTED_GIFT_NOK} kr.`}
      </p>
      <Button asChild variant="ink" className="w-full sm:w-auto">
        <a href={donationUrl || SPLEIS_PROJECT_URL} target="_blank" rel="noopener noreferrer">
          Gi via Spleis
        </a>
      </Button>
      <p className="text-xs text-muted-foreground">
        Helt frivillig, og du får like mange lodd uansett.
      </p>
    </div>
  );

  if (!run && (!showFields || openDates.length === 0)) {
    return (
      <div className="space-y-4">
        {thanks}
        {openDates.length > 0 ? (
          <Button
            type="button"
            variant="line"
            className="w-full"
            onClick={() => {
              setSavedGift(null);
              setShowFields(true);
            }}
          >
            Registrer en tur til
          </Button>
        ) : (
          <p className="border-2 border-dashed border-foreground p-4 text-sm">
            Du har registrert tur for alle datoene som er åpne nå. Neste tur kan registreres i
            morgen.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="border-2 border-destructive bg-destructive/10 p-3 text-sm font-semibold text-destructive"
        >
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`run_date-${run?.id || 'new'}`}>Dato *</Label>
          <Input
            id={`run_date-${run?.id || 'new'}`}
            name="run_date"
            type="date"
            min={dates?.min}
            max={dates?.max}
            defaultValue={run?.run_date ?? openDates[0] ?? dates?.max}
            required
            disabled={loading || disabled || locked}
          />
          <p className="text-xs text-muted-foreground">
            {locked
              ? 'Dato og distanse kan bare endres innen et døgn etter turen.'
              : 'Registrer turen innen et døgn: i dag eller i går.'}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`distance-${run?.id || 'new'}`}>Distanse i km *</Label>
          <Input
            id={`distance-${run?.id || 'new'}`}
            name="distance_km"
            type="number"
            min={MIN_RUN_KM - 0.5}
            max={MAX_RUN_KM}
            step="0.01"
            value={distance}
            onChange={(event) => setDistance(event.target.value)}
            required
            disabled={loading || disabled || locked}
          />
          {distanceKm > 0 && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {tickets >= MIN_RUN_KM
                ? `Gir ${tickets} lodd i hver valgt kategori av: ${qualifyingCategories(distanceKm)
                    .map((slug) => CATEGORY_META[slug].range)
                    .join(', ')}`
                : `Turen må være minst ${MIN_RUN_KM} km`}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`title-${run?.id || 'new'}`}>Navn på tur/løp</Label>
        <Input
          id={`title-${run?.id || 'new'}`}
          name="title"
          maxLength={100}
          defaultValue={run?.title || ''}
          placeholder="F.eks. 3-Sjøersløpet"
          disabled={loading || disabled}
        />
      </div>
      <div className="flex items-start gap-3 border-2 border-foreground p-4">
        <Checkbox
          id={`barteloypa-${run?.id || 'new'}`}
          className="mt-0.5"
          checked={onBarteloypa}
          onCheckedChange={(checked) => setOnBarteloypa(checked === true)}
          disabled={loading || disabled}
        />
        <div className="space-y-1 text-sm">
          <label
            htmlFor={`barteloypa-${run?.id || 'new'}`}
            className="cursor-pointer font-semibold"
          >
            Jeg løp eller gikk Barteløypa
          </label>
          <p className="text-xs text-muted-foreground">
            Turen får et bartemerke på forsiden. Det gir ingen ekstra lodd: lodd regnes bare ut fra
            distansen, uansett hvor du løper.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`evidence-file-${run?.id || 'new'}`}>Bilde fra turen</Label>
        <Input
          id={`evidence-file-${run?.id || 'new'}`}
          name="evidence_file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={loading || disabled}
        />
        <p className="text-xs text-muted-foreground">
          Valgfritt og offentlig. Et skjermbilde fra Strava eller klokka går fint. Maks{' '}
          {MAX_ORIGINAL_MB} MB. Bildet forminskes før opplasting, og posisjonsdata fjernes.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`comment-${run?.id || 'new'}`}>Kommentar</Label>
        <Textarea
          id={`comment-${run?.id || 'new'}`}
          name="comment"
          maxLength={500}
          defaultValue={run?.comment || ''}
          disabled={loading || disabled}
        />
      </div>
      <div className="flex items-start gap-3 border-2 border-foreground bg-accent/30 p-4">
        <Checkbox
          id={`confirmed-${run?.id || 'new'}`}
          className="mt-0.5"
          checked={confirmed}
          onCheckedChange={(checked) => setConfirmed(checked === true)}
          disabled={loading || disabled}
        />
        <div className="text-sm">
          <label htmlFor={`confirmed-${run?.id || 'new'}`} className="cursor-pointer">
            Jeg bekrefter at jeg har gått eller løpt turen selv, og at distansen er riktig.
          </label>
        </div>
      </div>
      <Button
        type="submit"
        variant="ink"
        size="lg"
        className="w-full"
        disabled={loading || disabled || !confirmed}
      >
        {loading ? 'Lagrer…' : run ? 'Lagre endringer' : 'Registrer tur'}
      </Button>
    </form>
  );
}
