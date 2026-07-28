'use client';

import { useState } from 'react';
import { updateDistanceInterests } from '@/app/actions/runs';
import { Button } from '@/app/_shared/components/ui/button';
import type { DistanceCategorySlug } from '@/app/_shared/types/event-2026';

const categories: Array<{ slug: DistanceCategorySlug; label: string; help: string }> = [
  { slug: 'short', label: '0–10 km', help: '3 km, 5 km og 10 km' },
  { slug: 'medium', label: '10–30 km', help: '10 miles og halvmaraton' },
  { slug: 'long', label: '30+ km', help: 'Maraton og ultraløp' },
];

export function Interests2026({ initial, disabled }: { initial: string[]; disabled: boolean }) {
  const [selected, setSelected] = useState(initial);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  function toggle(slug: string) {
    setSelected((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]
    );
  }

  async function save() {
    setLoading(true);
    setStatus('');
    const result = await updateDistanceInterests(selected);
    setLoading(false);
    setStatus(result.success ? 'Lagret' : result.error);
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <label
          key={category.slug}
          className="flex cursor-pointer items-center gap-3 border-2 border-foreground p-3 transition-colors has-[:checked]:bg-accent"
        >
          <input
            type="checkbox"
            checked={selected.includes(category.slug)}
            onChange={() => toggle(category.slug)}
            disabled={disabled}
            className="h-4 w-4"
          />
          <span>
            <strong className="block text-sm">{category.label}</strong>
            <span className="text-xs text-muted-foreground">{category.help}</span>
          </span>
        </label>
      ))}
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={disabled || loading || selected.length === 0} size="sm">
          {loading ? 'Lagrer…' : 'Lagre interesser'}
        </Button>
        {status && <span className="text-sm text-muted-foreground">{status}</span>}
      </div>
    </div>
  );
}
