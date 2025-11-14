'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';
import { cn } from '@/app/_shared/lib/utils/cn';
import type { CompletionImage } from '@/app/_shared/lib/types/database';

interface ImageThumbnailStripProps {
  images: CompletionImage[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export function ImageThumbnailStrip({ images, currentIndex, onSelect }: ImageThumbnailStripProps) {
  if (images.length <= 1) return null;

  return (
    <div className="w-full border-t bg-background/95 p-4 backdrop-blur-sm">
      <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-2">
        {images.map((image, index) => {
          const isActive = index === currentIndex;
          const isStarred = image.is_starred;

          return (
            <button
              key={image.id}
              onClick={() => onSelect(index)}
              className={cn(
                'relative flex-shrink-0 overflow-hidden rounded-lg transition-all',
                'hover:ring-2 hover:ring-accent',
                isActive
                  ? 'ring-2 ring-accent ring-offset-2 ring-offset-background'
                  : 'opacity-60 hover:opacity-100'
              )}
              style={{ width: '80px', height: '80px' }}
            >
              <Image
                src={image.image_url}
                alt={`Bilde ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />

              {/* Starred badge */}
              {isStarred && (
                <div className="absolute right-1 top-1 rounded-full bg-accent p-1">
                  <Star className="h-3 w-3 fill-accent-foreground text-accent-foreground" />
                </div>
              )}

              {/* Image number */}
              <div className="absolute bottom-1 left-1 rounded bg-background/80 px-1.5 py-0.5 text-xs font-medium text-foreground">
                {index + 1}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
