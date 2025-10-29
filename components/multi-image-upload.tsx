'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Star, X, Upload, ImageIcon } from 'lucide-react'
import { validateImageFiles, formatFileSize, IMAGE_CONSTRAINTS } from '@/lib/constants/images'
import { cn } from '@/lib/utils/cn'

export interface ImageUploadState {
  id: string
  file: File
  preview: string
  caption?: string
  isStarred: boolean
  displayOrder: number
}

interface MultiImageUploadProps {
  images: ImageUploadState[]
  onImagesChange: (images: ImageUploadState[]) => void
  maxImages?: number
  disabled?: boolean
}

export function MultiImageUpload({
  images,
  onImagesChange,
  maxImages = IMAGE_CONSTRAINTS.MAX_IMAGES_PER_COMPLETION,
  disabled = false,
}: MultiImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return

      const fileArray = Array.from(files)

      // Validate
      const validation = validateImageFiles(fileArray, images.length)
      if (!validation.valid) {
        setError(validation.errors[0]?.message || 'Ugyldig fil')
        return
      }

      setError('')

      // Create image upload states
      const newImages: ImageUploadState[] = []
      let processed = 0

      fileArray.forEach((file, index) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const id = crypto.randomUUID()
          newImages.push({
            id,
            file,
            preview: reader.result as string,
            caption: '',
            isStarred: images.length === 0 && index === 0, // Star first image if no images exist
            displayOrder: images.length + index,
          })

          processed++
          if (processed === fileArray.length) {
            onImagesChange([...images, ...newImages])
          }
        }
        reader.readAsDataURL(file)
      })
    },
    [images, onImagesChange]
  )

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const files = e.dataTransfer.files
    handleFiles(files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const files = e.target.files
    handleFiles(files)
    // Reset input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleStarClick = (imageId: string) => {
    const updatedImages = images.map((img) => ({
      ...img,
      isStarred: img.id === imageId,
    }))
    onImagesChange(updatedImages)
  }

  const handleCaptionChange = (imageId: string, caption: string) => {
    if (caption.length > IMAGE_CONSTRAINTS.MAX_CAPTION_LENGTH) return

    const updatedImages = images.map((img) =>
      img.id === imageId ? { ...img, caption } : img
    )
    onImagesChange(updatedImages)
  }

  const handleDelete = (imageId: string) => {
    const updatedImages = images.filter((img) => img.id !== imageId)

    // If we deleted the starred image, star the first remaining image
    if (updatedImages.length > 0) {
      const hasStarred = updatedImages.some((img) => img.isStarred)
      if (!hasStarred) {
        updatedImages[0].isStarred = true
      }
    }

    // Update display order
    updatedImages.forEach((img, index) => {
      img.displayOrder = index
    })

    onImagesChange(updatedImages)
  }

  const canAddMore = images.length < maxImages

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && (
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed transition-colors',
            dragActive
              ? 'border-accent bg-accent/10'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleChange}
            disabled={disabled}
            className="hidden"
            id="multi-image-input"
          />
          <label
            htmlFor="multi-image-input"
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-8 cursor-pointer',
              disabled && 'cursor-not-allowed'
            )}
          >
            <div className="rounded-full bg-accent/20 p-3">
              {dragActive ? (
                <ImageIcon className="h-8 w-8 text-accent" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {dragActive ? 'Slipp bildene her' : 'Klikk for å velge bilder'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                eller dra og slipp bilder hit
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Maks {maxImages} bilder • {formatFileSize(IMAGE_CONSTRAINTS.MAX_FILE_SIZE)} per
                bilde
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-destructive/15 border border-destructive/50 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {images.length} av {maxImages} bilder
            </p>
            {images.some((img) => img.isStarred) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3 fill-accent text-accent" />
                Hovedbilde valgt
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={image.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />

                  {/* Starred Badge */}
                  {image.isStarred && (
                    <div className="absolute top-2 left-2 bg-accent text-accent-foreground rounded-full px-2 py-1 text-xs font-medium flex items-center gap-1 shadow-lg">
                      <Star className="h-3 w-3 fill-current" />
                      Hovedbilde
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant={image.isStarred ? 'default' : 'secondary'}
                      className="h-8 w-8 rounded-full shadow-lg"
                      onClick={() => handleStarClick(image.id)}
                      disabled={disabled}
                      title={image.isStarred ? 'Hovedbilde' : 'Velg som hovedbilde'}
                    >
                      <Star
                        className={cn(
                          'h-4 w-4',
                          image.isStarred && 'fill-current'
                        )}
                      />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 rounded-full shadow-lg"
                      onClick={() => handleDelete(image.id)}
                      disabled={disabled || images.length === 1}
                      title="Slett bilde"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Caption Input */}
                <div className="p-3">
                  <Input
                    type="text"
                    placeholder="Bildetekst (valgfritt)"
                    value={image.caption || ''}
                    onChange={(e) => handleCaptionChange(image.id, e.target.value)}
                    disabled={disabled}
                    maxLength={IMAGE_CONSTRAINTS.MAX_CAPTION_LENGTH}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {image.caption?.length || 0}/{IMAGE_CONSTRAINTS.MAX_CAPTION_LENGTH}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {images.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Last opp minst 1 bilde for å fortsette
          </p>
        </div>
      )}
    </div>
  )
}
