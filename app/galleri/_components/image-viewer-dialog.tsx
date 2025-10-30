'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle } from 'lucide-react'
import { CompletionWithParticipant, PhotoCommentWithParticipant } from '@/app/_shared/lib/types/database'
import { Button } from '@/app/_shared/components/ui/button'
import { useKeyboardNav } from './use-keyboard-nav'
import { cn } from '@/app/_shared/lib/utils/cn'
import { CommentList } from './comments/comment-list'
import { getComments } from '@/app/actions/comments'

interface ImageViewerDialogProps {
  isOpen: boolean
  onClose: () => void
  completion: CompletionWithParticipant
  currentIndex: number
  onNavigate: (direction: 'prev' | 'next') => void
  onVote: (completionId: string) => Promise<void>
  userVoteId: string | null
  totalImages: number
  currentUserId: string | null
  openWithComments?: boolean
}

export function ImageViewerDialog({
  isOpen,
  onClose,
  completion,
  currentIndex,
  onNavigate,
  onVote,
  userVoteId,
  totalImages,
  currentUserId,
  openWithComments = false,
}: ImageViewerDialogProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [showComments, setShowComments] = useState(openWithComments)
  const [comments, setComments] = useState<PhotoCommentWithParticipant[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  const hasVoted = userVoteId === completion.id
  const isFirstImage = currentIndex === 0
  const isLastImage = currentIndex === totalImages - 1

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  // Reset image loaded state when completion changes
  useEffect(() => {
    setImageLoaded(false)
    setShowComments(openWithComments)
    setComments([])
  }, [completion.id, openWithComments])

  // Load comments when comments section is opened
  useEffect(() => {
    if (!showComments || comments.length > 0) return

    const loadComments = async () => {
      setCommentsLoading(true)
      try {
        const result = await getComments(completion.id)
        if (result.success && result.data) {
          setComments(result.data)
        }
      } catch (error) {
        console.error('Error loading comments:', error)
      } finally {
        setCommentsLoading(false)
      }
    }

    loadComments()
  }, [showComments, completion.id, comments.length])

  // Preload adjacent images for better UX
  useEffect(() => {
    if (!isOpen) return

    // We would need the adjacent completions passed as props to preload them
    // For now, we'll just rely on browser caching
  }, [isOpen, currentIndex])

  // Handle keyboard navigation
  const handlePrevious = useCallback(() => {
    if (!isFirstImage) {
      onNavigate('prev')
    }
  }, [isFirstImage, onNavigate])

  const handleNext = useCallback(() => {
    if (!isLastImage) {
      onNavigate('next')
    }
  }, [isLastImage, onNavigate])

  useKeyboardNav({
    enabled: isOpen,
    onPrevious: handlePrevious,
    onNext: handleNext,
    onClose,
  })

  // Handle touch gestures for mobile
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && !isLastImage) {
      onNavigate('next')
    } else if (isRightSwipe && !isFirstImage) {
      onNavigate('prev')
    }
  }

  const handleVote = async () => {
    if (isVoting) return

    setIsVoting(true)
    try {
      await onVote(completion.id)
    } finally {
      setIsVoting(false)
    }
  }

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-viewer-title"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
        aria-label="Close viewer"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Previous button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handlePrevious()
        }}
        disabled={isFirstImage}
        className={cn(
          'absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-all hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black',
          'md:left-8',
          isFirstImage && 'cursor-not-allowed opacity-30 hover:bg-black/50'
        )}
        aria-label="Previous image"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Next button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleNext()
        }}
        disabled={isLastImage}
        className={cn(
          'absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-all hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black',
          'md:right-8',
          isLastImage && 'cursor-not-allowed opacity-30 hover:bg-black/50'
        )}
        aria-label="Next image"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Main content area */}
      <div
        className="relative flex h-full w-full flex-col items-center justify-center px-4 pb-48 pt-20 md:px-16 md:pb-40"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Image container */}
        <div
          ref={imageRef}
          className="relative flex max-h-[calc(100vh-20rem)] w-full max-w-5xl items-center justify-center md:max-h-[calc(100vh-18rem)]"
        >
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            </div>
          )}
          <Image
            src={completion.photo_url}
            alt={`Photo by ${completion.participant.full_name}`}
            width={1920}
            height={1080}
            className={cn(
              'max-h-full w-auto rounded-lg object-contain shadow-2xl transition-opacity duration-300',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            priority
          />
        </div>

        {/* Image counter */}
        <div className="absolute right-4 top-20 rounded-full bg-black/50 px-3 py-1 text-sm text-white md:right-8">
          {currentIndex + 1} / {totalImages}
        </div>

        {/* Metadata bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/90 to-transparent pt-16">
          <div className="mx-auto max-w-5xl p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              {/* Participant info */}
              <div className="flex-1 space-y-2 text-white">
                <h2
                  id="image-viewer-title"
                  className="text-xl font-bold md:text-2xl"
                >
                  {completion.participant.full_name}
                </h2>
                <div className="flex flex-wrap gap-4 text-sm text-white/80">
                  <div>
                    <span className="font-medium">Startnr:</span> {completion.participant.bib_number}
                  </div>
                  {completion.completed_date && (
                    <div>
                      <span className="font-medium">Dato:</span>{' '}
                      {new Date(completion.completed_date).toLocaleDateString('nb-NO')}
                    </div>
                  )}
                  {completion.duration_text && (
                    <div>
                      <span className="font-medium">Tid:</span> {completion.duration_text}
                    </div>
                  )}
                </div>
                {completion.comment && (
                  <p className="mt-2 text-sm text-white/90 md:text-base">
                    {completion.comment}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                {/* Comments button */}
                <Button
                  onClick={() => setShowComments(!showComments)}
                  variant="secondary"
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="hidden sm:inline">Kommentarer</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {completion.comment_count || 0}
                  </span>
                </Button>

                {/* Vote button */}
                <Button
                  onClick={handleVote}
                  disabled={isVoting || hasVoted}
                  variant={hasVoted ? 'secondary' : 'default'}
                  size="lg"
                  className={cn(
                    'flex items-center gap-2 transition-all',
                    hasVoted && 'cursor-default'
                  )}
                >
                  <Heart
                    className={cn(
                      'h-5 w-5',
                      hasVoted && 'fill-current'
                    )}
                  />
                  <span className="hidden sm:inline">
                    {isVoting ? 'Stemmer...' : hasVoted ? 'Du har stemt' : 'Stem'}
                  </span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {completion.vote_count}
                  </span>
                </Button>
              </div>
            </div>

            {/* Comments section */}
            {showComments && (
              <div className="mt-6 max-h-[300px] overflow-y-auto rounded-lg bg-black/60 p-4 backdrop-blur-md md:max-h-[400px]">
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                  </div>
                ) : (
                  <CommentList
                    completionId={completion.id}
                    initialComments={comments}
                    currentUserId={currentUserId}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint (desktop only) */}
      <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-xs text-white/60 md:block">
        Bruk piltaster eller H/L for å navigere • ESC for å lukke
      </div>
    </div>
  )
}
