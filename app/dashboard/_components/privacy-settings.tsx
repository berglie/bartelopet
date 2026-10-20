'use client';

import { useState } from 'react';
import { deleteUserAccount, exportUserData } from '@/app/actions/account';
import { Button } from '@/app/_shared/components/ui/button';
import { Input } from '@/app/_shared/components/ui/input';
import { Label } from '@/app/_shared/components/ui/label';

const CONFIRMATION = 'SLETT MIN KONTO';

/** GDPR: download all personal data, or delete the account. */
export function PrivacySettings() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');

  async function download() {
    setExporting(true);
    setError('');
    const result = await exportUserData();
    setExporting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'barteloepet-mine-data.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function remove() {
    setDeleting(true);
    setError('');
    const result = await deleteUserAccount(confirmation);
    if (!result.success) {
      setError(result.error);
      setDeleting(false);
      return;
    }
    window.location.href = '/';
  }

  return (
    <div className="space-y-5 text-sm">
      {error && (
        <div
          role="alert"
          className="border-2 border-destructive bg-destructive/10 p-3 font-semibold text-destructive"
        >
          {error}
        </div>
      )}
      <div className="space-y-2">
        <p>Last ned alt vi har lagret om deg, fra alle år, som en JSON-fil.</p>
        <Button type="button" variant="line" onClick={download} disabled={exporting}>
          {exporting ? 'Henter…' : 'Last ned mine data'}
        </Button>
      </div>
      <div className="space-y-2 border-t-2 border-foreground/15 pt-5">
        <p>
          Sletter påmeldingen, turene, bildene og kontoen din for godt. Har du vunnet en premie,
          beholdes trekningen uten navn og kontaktinformasjon.
        </p>
        <Label htmlFor="delete-confirmation">Skriv «{CONFIRMATION}» for å bekrefte</Label>
        <Input
          id="delete-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          disabled={deleting}
        />
        <Button
          type="button"
          variant="destructive"
          onClick={remove}
          disabled={deleting || confirmation.trim().toUpperCase() !== CONFIRMATION}
        >
          {deleting ? 'Sletter…' : 'Slett kontoen min'}
        </Button>
      </div>
    </div>
  );
}
