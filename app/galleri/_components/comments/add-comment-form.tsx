'use client'

import { useState } from 'react'
import { Button } from '@/app/_shared/components/ui/button'
import { Textarea } from '@/app/_shared/components/ui/textarea'
import { Send } from 'lucide-react'

interface AddCommentFormProps {
  onSubmit: (commentText: string) => Promise<{ success: boolean; error?: string }>
  isSubmitting: boolean
  isLoggedIn: boolean
}

const MAX_COMMENT_LENGTH = 500

export function AddCommentForm({
  onSubmit,
  isSubmitting,
  isLoggedIn,
}: AddCommentFormProps) {
  const [commentText, setCommentText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const remainingChars = MAX_COMMENT_LENGTH - commentText.length
  const isOverLimit = remainingChars < 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoggedIn) {
      setError('Du ma vaere innlogget for a kommentere')
      return
    }

    const trimmedText = commentText.trim()
    if (!trimmedText) {
      setError('Kommentaren kan ikke vaere tom')
      return
    }

    if (isOverLimit) {
      setError(`Kommentaren er ${-remainingChars} tegn for lang`)
      return
    }

    setError(null)

    const result = await onSubmit(trimmedText)

    if (result.success) {
      setCommentText('')
    } else {
      setError(result.error || 'Kunne ikke legge til kommentar')
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-muted/50 rounded-lg p-4 text-center text-sm text-muted-foreground">
        Du ma vaere innlogget for a kommentere
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Textarea
          placeholder="Legg til en kommentar..."
          value={commentText}
          onChange={(e) => {
            setCommentText(e.target.value)
            if (error) setError(null)
          }}
          maxLength={MAX_COMMENT_LENGTH + 50}
          rows={3}
          disabled={isSubmitting}
          className="resize-none"
          aria-label="Kommentar"
        />
        <div className="flex items-center justify-between">
          <span
            className={`text-xs ${
              isOverLimit
                ? 'text-destructive font-medium'
                : remainingChars < 50
                  ? 'text-yellow-500 font-medium'
                  : 'text-muted-foreground'
            }`}
          >
            {remainingChars} tegn igjen
          </span>

          <Button
            type="submit"
            disabled={isSubmitting || !commentText.trim() || isOverLimit}
            size="sm"
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Sender...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}
    </form>
  )
}
