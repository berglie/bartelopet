'use client'

import { useState } from 'react'
import { Button } from '@/app/_shared/components/ui/button'
import { Label } from '@/app/_shared/components/ui/label'
import { Textarea } from '@/app/_shared/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/_shared/components/ui/dialog'
import { updateCompletion } from '@/app/actions/completions'
import { getCurrentEventYear } from '@/app/_shared/lib/utils/event-year'

type Completion = {
  id: string
  participant_id: string
  completed_date: string
  duration_text: string | null
  comment: string | null
}

interface EditFieldDialogProps {
  isOpen: boolean
  onClose: () => void
  completion: Completion
  field: 'date' | 'time' | 'comment'
  onSuccess: () => void
}

export function EditFieldDialog({
  isOpen,
  onClose,
  completion,
  field,
  onSuccess,
}: EditFieldDialogProps) {
  const [value, setValue] = useState(() => {
    if (field === 'date') return completion.completed_date.split('T')[0]
    if (field === 'time') return completion.duration_text || ''
    return completion.comment || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getTitle = () => {
    if (field === 'date') return 'Endre dato'
    if (field === 'time') return 'Endre tid'
    return 'Endre kommentar'
  }

  const getDescription = () => {
    if (field === 'date') return 'Oppdater dato for fullforingen'
    if (field === 'time') return 'Oppdater tid brukt pa lopet'
    return 'Oppdater kommentaren din'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const updateData: Record<string, string | null> = {}

      if (field === 'date') {
        updateData.completed_date = value
      } else if (field === 'time') {
        updateData.duration_text = value || null
      } else {
        updateData.comment = value || null
      }

      const result = await updateCompletion(
        completion.id,
        updateData,
        false
      )

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Kunne ikke oppdatere')
      }
    } catch (err) {
      console.error('Error updating field:', err)
      setError('En uventet feil oppstod')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field === 'date' && (
            <div className="space-y-2">
              <Label htmlFor="date-field">Dato *</Label>
              <input
                id="date-field"
                type="date"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                min={`${getCurrentEventYear()}-01-01`}
                max={new Date().toISOString().split('T')[0]}
                required
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}

          {field === 'time' && (
            <div className="space-y-2">
              <Label htmlFor="time-field">Tid</Label>
              <input
                id="time-field"
                type="text"
                placeholder="f.eks. 1t 30min"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={isSubmitting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}

          {field === 'comment' && (
            <div className="space-y-2">
              <Label htmlFor="comment-field">Kommentar</Label>
              <Textarea
                id="comment-field"
                placeholder="Fortell om opplevelsen din..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={4}
                maxLength={500}
                disabled={isSubmitting}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {value.length}/500 tegn
              </p>
            </div>
          )}

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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Lagrer...
                </>
              ) : (
                'Lagre'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
