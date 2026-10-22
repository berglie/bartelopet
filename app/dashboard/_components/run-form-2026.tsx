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
  ticketsForRun,
  type RunDateRange,
} from '@/app/_shared/types/event-2026';
import type { Database } from '@/app/_shared/lib/supabase/types';
import { formatMegabytes, RUN_PHOTO_LIMITS } from '@/app/_shared/lib/constants/images';
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

export function RunForm2026({
  run,
  disabled = false,
  donationUrl,
  dates,
}: {
  run?: Run;
  disabled?: boolean;
  donationUrl?: string | null;
  /** Dates open for registration (today and yesterday), from the server. */
  dates: RunDateRange | null;
}) {
  const router = useRouter();
  const [distance, setDistance] = useState(run?.distance_km?.toString() || '');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Suggested gift for the last saved run. Shown after saving, never as a condition.
  const [savedGift, setSavedGift] = useState<{ km: number; amount: number } | null>(null);
  const distanceKm = Number(distance);
  // A new date or distance counts as a new registration, so older runs keep both.
  const locked = !dates || Boolean(run && run.run_date < dates.min);
  const tickets = distance && Number.isFinite(distanceKm) ? ticketsForRun(distanceKm) : 0;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Keep a reference: React clears event.currentTarget once we await below.
    const formElement = event.currentTarget;
    setLoading(true);
    setError('');
    setSavedGift(null);
    const form = new FormData(formElement);
    let evidenceUrl = String(form.get('evidence_url') || '');
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
        title: String(form.get('title') || ''),
        duration_text: String(form.get('duration_text') || ''),
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
        setSavedGift({ km: payload.distance_km, amount: donationForDistance(payload.distance_km) });
      }
      router.refresh();
    } catch {
      setError('Noe gikk galt under lagringen. Sjekk nettforbindelsen og prøv igjen.');
    } finally {
      setLoading(false);
    }
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
            defaultValue={run?.run_date ?? dates?.max}
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
          {tickets > 0 && (
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
      <div className="grid gap-4 sm:grid-cols-2">
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
        <div className="space-y-2">
          <Label htmlFor={`duration-${run?.id || 'new'}`}>Tid</Label>
          <Input
            id={`duration-${run?.id || 'new'}`}
            name="duration_text"
            maxLength={50}
            defaultValue={run?.duration_text || ''}
            placeholder="F.eks. 1:05:23"
            disabled={loading || disabled}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`evidence-${run?.id || 'new'}`}>Offentlig Strava-/aktivitetslenke</Label>
        <Input
          id={`evidence-${run?.id || 'new'}`}
          name="evidence_url"
          type="url"
          defaultValue={run?.evidence_url || ''}
          placeholder="https://..."
          disabled={loading || disabled}
        />
        <p className="text-xs text-muted-foreground">Valgfritt. Lenken blir synlig for alle.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`evidence-file-${run?.id || 'new'}`}>Eller last opp et bilde</Label>
        <Input
          id={`evidence-file-${run?.id || 'new'}`}
          name="evidence_file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={loading || disabled}
        />
        <p className="text-xs text-muted-foreground">
          Valgfritt og offentlig. Maks {MAX_ORIGINAL_MB} MB. Bildet forminskes før opplasting, og
          posisjonsdata fjernes.
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
      {savedGift && (
        <div
          role="status"
          className="space-y-2 border-2 border-foreground bg-secondary/30 p-4 text-sm"
        >
          <p className="font-display text-xl font-black uppercase">Takk for turen!</p>
          <p>
            Barteløpet er gratis, men vi håper du vil gi 5 kr per km til Prosjekt SUT. Turen din på{' '}
            {savedGift.km.toLocaleString('nb-NO')} km tilsvarer{' '}
            <strong>{savedGift.amount.toLocaleString('nb-NO')} kr</strong>.
          </p>
          {donationUrl && (
            <a
              href={donationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-semibold underline decoration-secondary decoration-2 underline-offset-2 hover:decoration-foreground"
            >
              Gi via Spleis
            </a>
          )}
          <p className="text-xs text-muted-foreground">
            Helt frivillig, og du får like mange lodd uansett.
          </p>
        </div>
      )}
    </form>
  );
}
