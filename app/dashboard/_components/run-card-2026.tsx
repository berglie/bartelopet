'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteRun } from '@/app/actions/runs';
import { Button } from '@/app/_shared/components/ui/button';
import { Card, CardContent } from '@/app/_shared/components/ui/card';
import { RunForm2026 } from './run-form-2026';
import type { Database } from '@/app/_shared/lib/supabase/types';
import { formatDate } from '@/app/_shared/lib/utils/format';

type Run = Database['public']['Tables']['runs']['Row'];

export function RunCard2026({
  run,
  canEdit,
  donationUrl,
}: {
  run: Run;
  canEdit: boolean;
  donationUrl?: string | null;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!window.confirm('Vil du slette denne turen? Loddene fra turen forsvinner også.')) return;
    setDeleting(true);
    const result = await deleteRun(run.id);
    setDeleting(false);
    if (!result.success) window.alert(result.error);
    router.refresh();
  }

  return (
    <Card className="border-2 border-foreground shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-2xl font-black uppercase">
              {run.title || 'Løpetur'}
            </div>
            <div className="text-sm tabular-nums text-muted-foreground">
              {formatDate(run.run_date, { weekday: 'short', year: undefined })} ·{' '}
              {run.distance_km.toLocaleString('nb-NO')} km ·{' '}
              {run.donation_amount_nok.toLocaleString('nb-NO')} kr
            </div>
          </div>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={remove}
              disabled={deleting}
              className="border-2 border-foreground hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              {deleting ? 'Sletter…' : 'Slett'}
            </Button>
          )}
        </div>
        {run.comment && <p className="mt-3 text-sm">{run.comment}</p>}
        {run.evidence_url && (
          <a
            href={run.evidence_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-semibold underline decoration-secondary decoration-2 underline-offset-2 hover:decoration-foreground"
          >
            Se aktivitet
          </a>
        )}
        {canEdit && (
          <details className="mt-4 border-t-2 border-foreground/15 pt-4">
            <summary className="cursor-pointer text-sm font-black uppercase tracking-wide">
              Rediger tur
            </summary>
            <div className="mt-4">
              <RunForm2026 run={run} donationUrl={donationUrl} />
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
