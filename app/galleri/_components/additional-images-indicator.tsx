'use client'

import { Images } from 'lucide-react'
import { Button } from '@/app/_shared/components/ui/button'
import { cn } from '@/app/_shared/lib/utils/cn'

interface AdditionalImagesIndicatorProps {
  count: number
  onViewAll?: () => void
  className?: string
}

export function AdditionalImagesIndicator({
  count,
  onViewAll,
  className,
}: AdditionalImagesIndicatorProps) {
  if (count === 0) return null

  return (
    <Button
      variant="secondary"
      size="sm"
      className={cn(
        'absolute bottom-2 right-2 shadow-lg backdrop-blur-sm bg-background/90 hover:bg-background',
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        onViewAll?.()
      }}
    >
      <Images className="h-4 w-4 mr-1" />
      +{count} flere
    </Button>
  )
}
