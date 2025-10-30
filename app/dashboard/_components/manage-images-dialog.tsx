'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Star, Trash2, AlertTriangle, Plus } from 'lucide-react'
import { Button } from '@/app/_shared/components/ui/button'
import { Input } from '@/app/_shared/components/ui/input'
import { Label } from '@/app/_shared/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/_shared/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/_shared/components/ui/alert-dialog'
import {
  addCompletionImage,
  deleteCompletionImage,
  updateStarredImage,
  updateImageCaption,
  getCompletionImages,
} from '@/app/actions/completion-images'
import type { CompletionImage } from '@/app/_shared/lib/types/database'
import { validateImageFiles, IMAGE_CONSTRAINTS } from '@/app/_shared/lib/constants/images'
import { cn } from '@/app/_shared/lib/utils/cn'

interface ManageImagesDialogProps {
  isOpen: boolean
  onClose: () => void
  completionId: string
  onSuccess: () => void
}

export function ManageImagesDialog({
  isOpen,
  onClose,
  completionId,
  onSuccess,
}: ManageImagesDialogProps) {
  const [images, setImages] = useState<CompletionImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [starConfirm, setStarConfirm] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchImages = async () => {
    setLoading(true)
    setError(null)

    const result = await getCompletionImages(completionId)
    if (result.success && result.data) {
      setImages(result.data)
    } else {
      setError(result.error || 'Kunne ikke hente bilder')
    }

    setLoading(false)
  }

  // Fetch images when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchImages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, completionId])

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    const validation = validateImageFiles([file], images.length)
    if (!validation.valid) {
      setError(validation.errors[0]?.message || 'Ugyldig fil')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Data = reader.result as string

        const result = await addCompletionImage(
          completionId,
          base64Data,
          file.name,
          file.type
        )

        if (result.success) {
          await fetchImages()
          onSuccess()
        } else {
          setError(result.error || 'Kunne ikke laste opp bilde')
        }

        setUploading(false)

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Error uploading image:', err)
      setError('En uventet feil oppstod')
      setUploading(false)
    }
  }

  const handleStarImage = async (imageId: string) => {
    const image = images.find((img) => img.id === imageId)
    if (!image || image.is_starred) return

    // Show confirmation if this will reset votes
    setStarConfirm(imageId)
  }

  const confirmStarChange = async () => {
    if (!starConfirm) return

    setError(null)

    const result = await updateStarredImage(completionId, starConfirm, true)

    if (result.success) {
      await fetchImages()
      onSuccess()
      setStarConfirm(null)
    } else {
      setError(result.error || 'Kunne ikke oppdatere hovedbilde')
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    setDeleteConfirm(imageId)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    setError(null)

    const result = await deleteCompletionImage(completionId, deleteConfirm)

    if (result.success) {
      await fetchImages()
      onSuccess()
      setDeleteConfirm(null)
    } else {
      setError(result.error || 'Kunne ikke slette bilde')
    }
  }

  const handleCaptionChange = async (imageId: string, caption: string) => {
    // Update locally immediately for better UX
    setImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, caption } : img))
    )

    // Debounce API call would be better, but for now just call directly
    const result = await updateImageCaption(imageId, caption)

    if (!result.success) {
      setError(result.error || 'Kunne ikke oppdatere bildetekst')
      // Revert on error
      await fetchImages()
    }
  }

  const starredImage = images.find((img) => img.is_starred)
  const canAddMore = images.length < IMAGE_CONSTRAINTS.MAX_IMAGES_PER_COMPLETION

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Administrer bilder</DialogTitle>
            <DialogDescription>
              Legg til flere bilder, velg hovedbilde, eller slett bilder. Du må ha minst ett bilde.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-accent" />
              </div>
            )}

            {/* Images grid */}
            {!loading && images.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {images.length} av {IMAGE_CONSTRAINTS.MAX_IMAGES_PER_COMPLETION} bilder
                  </p>
                  {starredImage && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      Hovedbilde valgt
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className={cn(
                        'rounded-lg border overflow-hidden transition-all',
                        image.is_starred && 'ring-2 ring-accent ring-offset-2 ring-offset-background'
                      )}
                    >
                      {/* Image */}
                      <div className="relative aspect-video">
                        <Image
                          src={image.image_url}
                          alt={image.caption || 'Bilde'}
                          fill
                          className="object-cover"
                        />

                        {/* Starred badge */}
                        {image.is_starred && (
                          <div className="absolute top-2 left-2 bg-accent text-accent-foreground rounded-full px-2 py-1 text-xs font-medium flex items-center gap-1 shadow-lg">
                            <Star className="h-3 w-3 fill-current" />
                            Hovedbilde
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            size="icon"
                            variant={image.is_starred ? 'default' : 'secondary'}
                            className="h-8 w-8 rounded-full shadow-lg"
                            onClick={() => handleStarImage(image.id)}
                            disabled={image.is_starred || uploading}
                            title={image.is_starred ? 'Hovedbilde' : 'Velg som hovedbilde'}
                          >
                            <Star className={cn('h-4 w-4', image.is_starred && 'fill-current')} />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8 rounded-full shadow-lg"
                            onClick={() => handleDeleteImage(image.id)}
                            disabled={images.length === 1 || uploading}
                            title="Slett bilde"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Caption */}
                      <div className="p-3">
                        <Label htmlFor={`caption-${image.id}`} className="text-xs">
                          Bildetekst (valgfritt)
                        </Label>
                        <Input
                          id={`caption-${image.id}`}
                          type="text"
                          placeholder="Legg til beskrivelse..."
                          value={image.caption || ''}
                          onChange={(e) => handleCaptionChange(image.id, e.target.value)}
                          disabled={uploading}
                          maxLength={IMAGE_CONSTRAINTS.MAX_CAPTION_LENGTH}
                          className="text-sm mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                          {image.caption?.length || 0}/{IMAGE_CONSTRAINTS.MAX_CAPTION_LENGTH}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add more button */}
            {!loading && canAddMore && (
              <div className="border-2 border-dashed rounded-lg p-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAddImage}
                  disabled={uploading}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
                      Laster opp...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Legg til flere bilder ({IMAGE_CONSTRAINTS.MAX_IMAGES_PER_COMPLETION - images.length} igjen)
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Maks 10MB per bilde
                </p>
              </div>
            )}

            {/* Max limit reached */}
            {!loading && !canAddMore && (
              <div className="text-center text-sm text-muted-foreground">
                Du har nådd maksimalt antall bilder (
                {IMAGE_CONSTRAINTS.MAX_IMAGES_PER_COMPLETION})
              </div>
            )}

            {/* Close button */}
            <div className="flex justify-end">
              <Button onClick={onClose}>Ferdig</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett bilde?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette dette bildet? Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Star change confirmation dialog */}
      <AlertDialog open={!!starConfirm} onOpenChange={() => setStarConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Endre hovedbilde?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Når du endrer hovedbilde, vil <strong>alle stemmer bli nullstilt</strong>. Dette er
                fordi det teknisk er en ny innsending i konkurransen.
              </p>
              <p className="text-sm">Er du sikker på at du vil fortsette?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStarChange}>
              Ja, endre hovedbilde
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
