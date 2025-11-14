'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/_shared/components/ui/button';
import { Textarea } from '@/app/_shared/components/ui/textarea';
import { Label } from '@/app/_shared/components/ui/label';
import { addComment } from '@/app/actions/comments';

interface CommentFormProps {
  completionId: string;
  onCommentAdded?: () => void;
}

export function CommentForm({ completionId, onCommentAdded }: CommentFormProps) {
  const router = useRouter();
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const maxLength = 500;
  const remainingChars = maxLength - commentText.length;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedText = commentText.trim();
    if (!trimmedText) {
      setError('Kommentaren kan ikke være tom');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await addComment(completionId, trimmedText);

      if (!result.success) {
        // Check if authentication error
        if (result.error?.includes('innlogget')) {
          router.push('/login');
          return;
        }

        setError(result.error || 'Kunne ikke legge til kommentar');
        return;
      }

      // Success - clear form and notify parent
      setCommentText('');
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('En uventet feil oppstod. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="comment-text">Legg til en kommentar</Label>
        <Textarea
          id="comment-text"
          placeholder="Skriv din kommentar her..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          maxLength={maxLength}
          rows={3}
          disabled={loading}
          className="resize-none"
          aria-label="Kommentar"
        />
        <div className="flex items-center justify-between">
          <span
            className={`text-sm ${
              remainingChars < 50 ? 'font-medium text-destructive' : 'text-muted-foreground'
            }`}
          >
            {commentText.length}/{maxLength}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading || !commentText.trim()} className="w-full">
        {loading ? 'Legger til...' : 'Legg til kommentar'}
      </Button>
    </form>
  );
}
