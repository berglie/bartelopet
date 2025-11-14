'use client';

import { Images } from 'lucide-react';
import { Button } from '@/app/_shared/components/ui/button';
import { cn } from '@/app/_shared/lib/utils/cn';

interface AdditionalImagesIndicatorProps {
  count: number;
  onViewAll?: () => void;
  className?: string;
}

export function AdditionalImagesIndicator({
  count,
  onViewAll,
  className,
}: AdditionalImagesIndicatorProps) {
  if (count === 0) return null;

  return (
    <Button
      variant="secondary"
      size="sm"
      className={cn(
        'absolute bottom-2 right-2 bg-background/90 shadow-lg backdrop-blur-sm hover:bg-background',
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        onViewAll?.();
      }}
    >
      <Images className="mr-1 h-4 w-4" />+{count} flere
    </Button>
  );
}
