'use client';

import { useYear } from '@/contexts/year-context';
import { getAvailableYears, getCurrentEventYear } from '@/app/_shared/lib/utils/year';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/app/_shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/app/_shared/components/ui/dropdown-menu';

interface YearSelectorProps {
  variant?: 'default' | 'compact';
  className?: string;
}

/**
 * YearSelector component - dropdown for selecting event year
 */
export function YearSelector({ variant = 'default', className = '' }: YearSelectorProps) {
  const { selectedYear, setSelectedYear } = useYear();
  const availableYears = getAvailableYears();
  const currentEventYear = getCurrentEventYear();

  if (availableYears.length <= 1) {
    // Don't show selector if only one year is available
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === 'compact' ? 'ghost' : 'outline'}
          size={variant === 'compact' ? 'sm' : 'default'}
          className={`gap-2 ${className}`}
        >
          <Calendar className="h-4 w-4" />
          <span className="font-semibold">{selectedYear}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Velg år</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableYears.reverse().map((year) => {
          const isCurrent = year === currentEventYear;
          const isSelected = year === selectedYear;

          return (
            <DropdownMenuItem
              key={year}
              onClick={() => setSelectedYear(year)}
              className={isSelected ? 'bg-accent/10' : ''}
            >
              <div className="flex w-full items-center justify-between">
                <span className={isSelected ? 'font-semibold' : ''}>{year}</span>
                {isCurrent && (
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                    Nåværende
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Compact year tabs for mobile
 */
export function YearTabs({ className = '' }: { className?: string }) {
  const { selectedYear, setSelectedYear } = useYear();
  const availableYears = getAvailableYears();

  if (availableYears.length <= 1) {
    return null;
  }

  return (
    <div className={`flex gap-2 overflow-x-auto ${className}`}>
      {availableYears.reverse().map((year) => {
        const isSelected = year === selectedYear;

        return (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            } `}
          >
            {year}
          </button>
        );
      })}
    </div>
  );
}
