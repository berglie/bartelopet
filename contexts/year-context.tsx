'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getCurrentEventYear, isValidEventYear } from '@/app/_shared/lib/utils/year';

interface YearContextValue {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  isCurrentYear: boolean;
}

const YearContext = createContext<YearContextValue | undefined>(undefined);

interface YearProviderProps {
  children: React.ReactNode;
  initialYear?: number;
}

/**
 * YearProvider manages the selected year state and syncs it with URL params
 */
export function YearProvider({ children, initialYear }: YearProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize year from URL param or default to current event year
  const [selectedYear, setSelectedYearState] = useState<number>(() => {
    const yearParam = searchParams?.get('year');
    if (yearParam) {
      const year = parseInt(yearParam, 10);
      if (isValidEventYear(year)) {
        return year;
      }
    }
    return initialYear || getCurrentEventYear();
  });

  const currentEventYear = getCurrentEventYear();
  const isCurrentYear = selectedYear === currentEventYear;

  // Update URL when year changes
  const setSelectedYear = useCallback(
    (year: number) => {
      if (!isValidEventYear(year)) {
        console.warn(`Invalid year: ${year}`);
        return;
      }

      setSelectedYearState(year);

      // Update URL with new year parameter
      const params = new URLSearchParams(searchParams?.toString() || '');

      if (year === currentEventYear) {
        // Remove year param if it's the current year (default)
        params.delete('year');
      } else {
        params.set('year', year.toString());
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      router.replace(newUrl, { scroll: false });
    },
    [router, pathname, searchParams, currentEventYear]
  );

  // Sync with URL changes (e.g., browser back/forward)
  // This effect intentionally updates state when URL params change (browser navigation)
  // The ref prevents infinite loops by only updating when the param actually changes
  const prevYearParamRef = React.useRef<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const yearParam = searchParams?.get('year');

    // Skip if year param hasn't changed
    if (prevYearParamRef.current === yearParam) {
      return;
    }
    prevYearParamRef.current = yearParam;

    const parsedYear = yearParam ? parseInt(yearParam, 10) : null;

    // Only update if the year has actually changed to avoid cascading renders
    if (parsedYear && isValidEventYear(parsedYear) && parsedYear !== selectedYear) {
      setSelectedYearState(parsedYear);
    } else if (!yearParam && selectedYear !== currentEventYear) {
      // If no year param but selected year isn't current, reset to current
      setSelectedYearState(currentEventYear);
    }
  }, [searchParams, selectedYear, currentEventYear]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <YearContext.Provider
      value={{
        selectedYear,
        setSelectedYear,
        isCurrentYear,
      }}
    >
      {children}
    </YearContext.Provider>
  );
}

/**
 * Hook to access year context
 */
export function useYear() {
  const context = useContext(YearContext);
  if (context === undefined) {
    throw new Error('useYear must be used within a YearProvider');
  }
  return context;
}

/**
 * Hook to get just the selected year without full context
 */
export function useSelectedYear() {
  const { selectedYear } = useYear();
  return selectedYear;
}

/**
 * Hook to check if viewing current year
 */
export function useIsCurrentYear() {
  const { isCurrentYear } = useYear();
  return isCurrentYear;
}
