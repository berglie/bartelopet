'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRun, updateRun } from '@/app/actions/runs';
import { Button } from '@/app/_shared/components/ui/button';
import { Input } from '@/app/_shared/components/ui/input';
import { Label } from '@/app/_shared/components/ui/label';
import { Textarea } from '@/app/_shared/components/ui/textarea';
import { donationForDistance } from '@/app/_shared/types/event-2026';
import type { Database } from '@/app/_shared/lib/supabase/types';
import { createClient } from '@/app/_shared/lib/supabase/client';

type Run = Database['public']['Tables']['runs']['Row'];

export function RunForm2026({
  run,
  disabled = false,
  donationUrl,
}: {
  run?: Run;
  disabled?: boolean;
  donationUrl?: string | null;
}) {
  const router = useRouter();
  const [distance, setDistance] = useState(run?.distance_km?.toString() || '');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const donation = useMemo(
    () => donationForDistance(Number.isFinite(Number(distance)) ? Number(distance) : 0),
    [distance]
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    let evidenceUrl = String(form.get('evidence_url') || '');
    const evidenceFile = form.get('evidence_file');

    if (evidenceFile instanceof File && evidenceFile.size > 0) {
      if (!evidenceFile.type.startsWith('image/') || evidenceFile.size > 5 * 1024 * 1024) {
        setError('Bildet må være en bildefil på maksimalt 5 MB');
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('Du må være innlogget');
        setLoading(false);
        return;
      }
      const extension = evidenceFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('run-evidence')
        .upload(path, evidenceFile, { contentType: evidenceFile.type });
      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }
      evidenceUrl = supabase.storage.from('run-evidence').getPublicUrl(path).data.publicUrl;
    }

    const payload = {
      run_date: String(form.get('run_date')),
      distance_km: Number(form.get('distance_km')),
      donation_confirmed: confirmed as true,
      title: String(form.get('title') || ''),
      duration_text: String(form.get('duration_text') || ''),
      comment: String(form.get('comment') || ''),
      evidence_url: evidenceUrl,
    };

    const result = run ? await updateRun(run.id, payload) : await createRun(payload);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (!run) {
      event.currentTarget.reset();
      setDistance('');
      setConfirmed(false);
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`run_date-${run?.id || 'new'}`}>Dato *</Label>
          <Input
            id={`run_date-${run?.id || 'new'}`}
            name="run_date"
            type="date"
            min="2026-11-01"
            max="2026-11-30"
            defaultValue={run?.run_date}
            required
            disabled={loading || disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`distance-${run?.id || 'new'}`}>Distanse i km *</Label>
          <Input
            id={`distance-${run?.id || 'new'}`}
            name="distance_km"
            type="number"
            min="0.01"
            max="500"
            step="0.01"
            value={distance}
            onChange={(event) => setDistance(event.target.value)}
            required
            disabled={loading || disabled}
          />
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
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={loading || disabled}
        />
        <p className="text-xs text-muted-foreground">Valgfritt og offentlig. Maks 5 MB.</p>
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
      <label className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          disabled={loading || disabled}
        />
        <span className="text-sm">
          Jeg bekrefter at jeg har donert minst{' '}
          <strong className="text-accent">{donation.toLocaleString('nb-NO')} kr</strong> (5 kr per
          km).
          {donationUrl && (
            <>
              {' '}
              <a
                href={donationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent underline"
              >
                Åpne innsamlingen
              </a>
            </>
          )}
        </span>
      </label>
      <Button
        type="submit"
        className="w-full"
        disabled={loading || disabled || !confirmed || donation < 1}
      >
        {loading ? 'Lagrer…' : run ? 'Lagre endringer' : 'Registrer tur'}
      </Button>
    </form>
  );
}
