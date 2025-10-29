'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { X, Upload, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { updateCompletion, uploadPhoto } from '@/app/actions/completions'

type Completion = {
  id: string
  participant_id: string
  photo_url: string
}

interface EditPhotoDialogProps {
  isOpen: boolean
  onClose: () => void
  completion: Completion
  onSuccess: () => void
}

export function EditPhotoDialog({
  isOpen,
  onClose,
  completion,
  onSuccess,
}: EditPhotoDialogProps) {
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null)
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Vennligst velg en bildefil')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Bildet er for stort. Maksimal storrelse er 10MB')
      return
    }

    setNewPhotoFile(file)
    setError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setNewPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveNewPhoto = () => {
    setNewPhotoFile(null)
    setNewPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPhotoFile || !newPhotoPreview) {
      setError('Vennligst velg et bilde')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const uploadResult = await uploadPhoto(
        newPhotoPreview,
        newPhotoFile.name,
        newPhotoFile.type,
        completion.participant_id
      )

      if (!uploadResult.success || !uploadResult.data) {
        setError(uploadResult.error || 'Kunne ikke laste opp bilde')
        setIsSubmitting(false)
        return
      }

      const result = await updateCompletion(
        completion.id,
        {
          photo_url: uploadResult.data,
        },
        true
      )

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Kunne ikke oppdatere')
      }
    } catch (err) {
      console.error('Error updating photo:', err)
      setError('En uventet feil oppstod')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Endre bilde</DialogTitle>
          <DialogDescription>
            Last opp et nytt bilde av fullforingen din
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Nytt bilde</Label>

            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              <Image
                src={newPhotoPreview || completion.photo_url}
                alt="Bilde"
                fill
                className="object-cover"
              />
            </div>

            {newPhotoFile && (
              <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-500">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Advarsel: Stemmer vil bli nullstilt</p>
                  <p className="mt-1 text-xs">
                    Hvis du endrer bildet, vil alle stemmer bli slettet.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                {newPhotoFile ? 'Velg et annet bilde' : 'Velg bilde'}
              </Button>

              {newPhotoFile && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemoveNewPhoto}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Avbryt
                </Button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting || !newPhotoFile}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Lagrer...
                </>
              ) : (
                'Lagre nytt bilde'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
