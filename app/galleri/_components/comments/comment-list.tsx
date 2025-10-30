'use client'

import { useState } from 'react'
import { PhotoCommentWithParticipant } from '@/app/_shared/lib/types/database'
import { CommentItem } from './comment-item'
import { AddCommentForm } from './add-comment-form'
import { addComment } from '@/app/actions/comments'
import { MessageCircle } from 'lucide-react'

interface CommentListProps {
  completionId: string
  initialComments: PhotoCommentWithParticipant[]
  currentUserId: string | null
}

export function CommentList({
  completionId,
  initialComments,
  currentUserId,
}: CommentListProps) {
  const [comments, setComments] = useState<PhotoCommentWithParticipant[]>(initialComments)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddComment = async (commentText: string) => {
    setIsSubmitting(true)
    try {
      const response = await addComment(completionId, commentText)

      if (response.success && response.data) {
        // Add the new comment to the list
        setComments([...comments, response.data])
        return { success: true }
      } else {
        return { success: false, error: response.error || 'Kunne ikke legge til kommentar' }
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      return { success: false, error: 'En uventet feil oppstod' }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = (commentId: string) => {
    // Optimistically remove the comment from the list
    setComments(comments.filter(c => c.id !== commentId))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">
          Kommentarer ({comments.length})
        </h3>
      </div>

      {/* Comment list */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Ingen kommentarer ennå. Vær den første til å kommentere!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onDelete={() => handleDeleteComment(comment.id)}
            />
          ))
        )}
      </div>

      {/* Add comment form */}
      <AddCommentForm
        onSubmit={handleAddComment}
        isSubmitting={isSubmitting}
        isLoggedIn={currentUserId !== null}
      />
    </div>
  )
}
