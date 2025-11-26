'use client';

import { useState } from 'react';
import { Button } from '@/app/_shared/components/ui/button';
import { Textarea } from '@/app/_shared/components/ui/textarea';
import { Send } from 'lucide-react';

interface AddCommentFormProps {
  onSubmit: (commentText: string) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
  isLoggedIn: boolean;
}

const MAX_COMMENT_LENGTH = 500;

export function AddCommentForm({ onSubmit, isSubmitting, isLoggedIn }: AddCommentFormProps) {
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const remainingChars = MAX_COMMENT_LENGTH - commentText.length;
  const isOverLimit = remainingChars < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setError('Du må være innlogget for å kommentere');
      return;
    }

    const trimmedText = commentText.trim();
    if (!trimmedText) {
      setError('Kommentaren kan ikke vaere tom');
      return;
    }

    if (isOverLimit) {
      setError(`Kommentaren er ${-remainingChars} tegn for lang`);
      return;
    }

    setError(null);

    const result = await onSubmit(trimmedText);

    if (result.success) {
      setCommentText('');
    } else {
      setError(result.error || 'Kunne ikke legge til kommentar');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="rounded-lg bg-muted/50 p-3 text-center text-sm text-muted-foreground md:p-4">
        Du må være innlogget for å kommentere
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 md:space-y-3">
      <div className="space-y-2">
        <Textarea
          placeholder="Legg til en kommentar..."
          value={commentText}
          onChange={(e) => {
            setCommentText(e.target.value);
            if (error) setError(null);
          }}
          maxLength={MAX_COMMENT_LENGTH + 50}
          rows={2}
          disabled={isSubmitting}
          className="min-h-[60px] resize-none text-base md:min-h-[80px] md:text-sm"
          aria-label="Kommentar"
        />
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs ${
              isOverLimit
                ? 'font-medium text-destructive'
                : remainingChars < 50
                  ? 'font-medium text-yellow-500'
                  : 'text-muted-foreground'
            }`}
          >
            {remainingChars} tegn igjen
          </span>

          <Button
            type="submit"
            disabled={isSubmitting || !commentText.trim() || isOverLimit}
            size="default"
            className="flex min-h-[44px] min-w-[80px] items-center gap-2 md:min-h-[36px] md:min-w-0"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <span className="hidden sm:inline">Sender...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </form>
  );
}
