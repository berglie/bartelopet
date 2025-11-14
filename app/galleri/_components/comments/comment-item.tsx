'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { Button } from '@/app/_shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/_shared/components/ui/dialog';
import { deleteComment } from '@/app/actions/comments';
import type { PhotoCommentWithParticipant } from '@/app/_shared/lib/types/database';

interface CommentItemProps {
  comment: PhotoCommentWithParticipant;
  currentParticipantId: string | null;
  onDelete?: () => void;
}

export function CommentItem({ comment, currentParticipantId, onDelete }: CommentItemProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Check ownership by comparing participant IDs
  const isOwner = currentParticipantId === comment.participant_id;

  // Format the relative time
  const relativeTime = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: nb,
  });

  // Handle missing participant data
  if (!comment.participant) {
    return null;
  }

  async function handleDelete() {
    setDeleting(true);
    setError('');

    try {
      const result = await deleteComment(comment.id);

      if (!result.success) {
        setError(result.error || 'Kunne ikke slette kommentar');
        return;
      }

      // Success - close dialog and notify parent
      setDialogOpen(false);
      if (onDelete) {
        onDelete();
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('En uventet feil oppstod. Prøv igjen.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg bg-muted/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{comment.participant.full_name}</span>
            <span className="text-xs text-muted-foreground">#{comment.participant.bib_number}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{relativeTime}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm">{comment.comment_text}</p>
        </div>

        {isOwner && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Slett kommentar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Slett kommentar</DialogTitle>
                <DialogDescription>
                  Er du sikker på at du vil slette denne kommentaren? Denne handlingen kan ikke
                  angres.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={deleting}>
                  Avbryt
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Sletter...' : 'Slett'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
