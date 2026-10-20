'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/app/_shared/lib/utils/cn';
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  type DistanceCategorySlug,
} from '@/app/_shared/types/event-2026';

interface CategoryPickerProps {
  selected: string[];
  onToggle: (slug: DistanceCategorySlug) => void;
  disabled?: boolean;
}

/** Selectable prize-category tiles, coloured like the categories everywhere else. */
export function CategoryPicker({ selected, onToggle, disabled }: CategoryPickerProps) {
  return (
    <div className="grid gap-2">
      {CATEGORY_ORDER.map((slug) => {
        const meta = CATEGORY_META[slug];
        const checked = selected.includes(slug);
        return (
          <label
            key={slug}
            className={cn(
              'flex cursor-pointer items-center gap-3 border-2 border-foreground p-3 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
              checked ? meta.solid : 'bg-card hover:bg-muted',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={() => onToggle(slug)}
              disabled={disabled}
            />
            <span
              aria-hidden="true"
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center border-2',
                checked ? 'border-current bg-background text-foreground' : 'border-foreground/50'
              )}
            >
              {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
            <span className="min-w-0">
              <span className="font-display block text-xl font-black uppercase leading-none">
                {meta.range}
              </span>
              <span className={cn('text-xs', checked ? 'opacity-80' : 'text-muted-foreground')}>
                {meta.examples}
              </span>
            </span>
          </label>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Loddene gjelder fullt ut i hver kategori du velger. Du kan vinne maks én premie, og de
        lengste løpene trekkes først, så velg bare kategoriene du helst vil vinne i.{' '}
        <Link href="/trekning" target="_blank" className="font-semibold underline">
          Les mer
        </Link>
      </p>
    </div>
  );
}
