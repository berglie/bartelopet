'use client';

import { useState } from 'react';
import { updateDistanceInterests } from '@/app/actions/runs';
import { Button } from '@/app/_shared/components/ui/button';
import { CategoryPicker } from '@/app/_shared/components/category-picker';

export function Interests2026({ initial, disabled }: { initial: string[]; disabled: boolean }) {
  const [selected, setSelected] = useState(initial);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const dirty =
    selected.length !== initial.length || selected.some((slug) => !initial.includes(slug));

  function toggle(slug: string) {
    setStatus(null);
    setSelected((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]
    );
  }

  async function save() {
    setLoading(true);
    setStatus(null);
    const result = await updateDistanceInterests(selected);
    setLoading(false);
    setStatus(result.success ? { ok: true, text: 'Lagret' } : { ok: false, text: result.error });
  }

  return (
    <div className="space-y-4">
      <CategoryPicker selected={selected} onToggle={toggle} disabled={disabled} />
      {disabled ? (
        <p className="text-xs text-muted-foreground">
          Kategoriene er låst fordi påmeldingen og turregistreringen er stengt.
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            onClick={save}
            variant="ink"
            size="sm"
            disabled={loading || selected.length === 0 || !dirty}
          >
            {loading ? 'Lagrer…' : 'Lagre valg'}
          </Button>
          <span
            role="status"
            className={status?.ok === false ? 'text-sm text-destructive' : 'text-sm font-semibold'}
          >
            {status?.text ??
              (selected.length === 0
                ? 'Velg minst én kategori'
                : dirty
                  ? 'Ulagrede endringer'
                  : '')}
          </span>
        </div>
      )}
    </div>
  );
}
