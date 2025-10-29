'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CompletionImage } from '@/lib/types/database'

interface ImageThumbnailStripProps {
  images: CompletionImage[]
  currentIndex: number
  onSelect: (index: number) => void
}

export function ImageThumbnailStrip({
  images,
  currentIndex,
  onSelect,
}: ImageThumbnailStripProps) {
  if (images.length <= 1) return null

  return (
    <div className="w-full bg-background/95 backdrop-blur-sm border-t p-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {images.map((image, index) => {
          const isActive = index === currentIndex
          const isStarred = image.is_starred

          return (
            <button
              key={image.id}
              onClick={() => onSelect(index)}
              className={cn(
                'relative flex-shrink-0 rounded-lg overflow-hidden transition-all',
                'hover:ring-2 hover:ring-accent',
                isActive
                  ? 'ring-2 ring-accent ring-offset-2 ring-offset-background'
                  : 'opacity-60 hover:opacity-100'
              )}
              style={{ width: '80px', height: '80px' }}
            >
              <img
                src={image.image_url}
                alt={`Bilde ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Starred badge */}
              {isStarred && (
                <div className="absolute top-1 right-1 bg-accent rounded-full p-1">
                  <Star className="h-3 w-3 fill-accent-foreground text-accent-foreground" />
                </div>
              )}

              {/* Image number */}
              <div className="absolute bottom-1 left-1 bg-background/80 text-foreground rounded px-1.5 py-0.5 text-xs font-medium">
                {index + 1}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
