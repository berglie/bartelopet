'use client';

import React from 'react';
import { AlertCircle, Lock, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/app/_shared/components/ui/card';
import {
  isSubmissionWindowOpen,
  getSubmissionWindowText,
  canSubmitForYear,
} from '@/app/_shared/lib/utils/year';
import { useIsCurrentYear, useSelectedYear } from '@/contexts/year-context';

interface EditRestrictionGuardProps {
  children: React.ReactNode;
  year?: number;
  showMessage?: boolean;
}

/**
 * Guard component that restricts editing based on submission window
 */
export function EditRestrictionGuard({
  children,
  year,
  showMessage = true,
}: EditRestrictionGuardProps) {
  const contextYear = useSelectedYear();
  const isCurrentYear = useIsCurrentYear();
  const targetYear = year ?? contextYear;
  const canEdit = canSubmitForYear(targetYear);

  if (canEdit) {
    return <>{children}</>;
  }

  if (!showMessage) {
    return null;
  }

  return <ReadOnlyMessage year={targetYear} isCurrentYear={isCurrentYear} />;
}

/**
 * Message component displayed when editing is restricted
 */
function ReadOnlyMessage({ year, isCurrentYear }: { year: number; isCurrentYear: boolean }) {
  return (
    <Card className="border-muted bg-muted/50">
      <CardContent className="space-y-4 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold">
            {isCurrentYear ? 'Innsendingsvinduet er stengt' : 'Historisk visning'}
          </h3>
          <p className="text-muted-foreground">{getSubmissionWindowText(year)}</p>
        </div>

        {isCurrentYear && !isSubmissionWindowOpen() && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Kom tilbake i november for å sende inn ditt løp</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Banner component for read-only mode
 */
export function ReadOnlyBanner({ year }: { year?: number }) {
  const contextYear = useSelectedYear();
  const targetYear = year ?? contextYear;
  const canEdit = canSubmitForYear(targetYear);

  if (canEdit) {
    return null;
  }

  return (
    <div className="mb-6 border-l-4 border-muted-foreground/30 bg-muted p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Kun lesevisning</p>
          <p className="text-sm text-muted-foreground">{getSubmissionWindowText(targetYear)}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check if editing is allowed
 */
export function useCanEdit(year?: number): boolean {
  const contextYear = useSelectedYear();
  const targetYear = year ?? contextYear;
  return canSubmitForYear(targetYear);
}

/**
 * Component wrapper that disables children when editing is restricted
 */
export function EditableWrapper({
  children,
  year,
  fallback,
}: {
  children: React.ReactNode;
  year?: number;
  fallback?: React.ReactNode;
}) {
  const canEdit = useCanEdit(year);

  if (!canEdit) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
}
