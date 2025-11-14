'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle } from 'lucide-react';
import {
  CompletionWithParticipant,
  PhotoCommentWithParticipant,
  CompletionImage,
} from '@/app/_shared/lib/types/database';
import { Button } from '@/app/_shared/components/ui/button';
import { useKeyboardNav } from './use-keyboard-nav';
import { cn } from '@/app/_shared/lib/utils/cn';
import { CommentList } from './comments/comment-list';
import { getComments } from '@/app/actions/comments';
import { ImageThumbnailStrip } from './image-thumbnail-strip';
import { ShareButton } from './share-button';
import { createPhotoShareData } from '@/app/_shared/lib/utils/share';

interface ImageViewerDialogMultiProps {
  isOpen: boolean;
  onClose: () => void;
  completion: CompletionWithParticipant & { images: CompletionImage[] };
  currentIndex: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onVote: (completionId: string) => Promise<void>;
  userVoteIds: string[];
  totalImages: number;
  currentParticipantId: string | null;
  isLoggedIn: boolean;
  openWithComments?: boolean;
}

export function ImageViewerDialogMulti({
  isOpen,
  onClose,
  completion,
  currentIndex,
  onNavigate,
  onVote,
  userVoteIds,
  totalImages,
  currentParticipantId,
  isLoggedIn,
  openWithComments = false,
}: ImageViewerDialogMultiProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showComments, setShowComments] = useState(openWithComments);
  const [comments, setComments] = useState<PhotoCommentWithParticipant[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Track current image within this completion
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageRef = useRef<HTMLDivElement>(null);

  // Detect desktop viewport
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const hasVoted = userVoteIds.includes(completion.id);
  const isFirstCompletion = currentIndex === 0;
  const isLastCompletion = currentIndex === totalImages - 1;

  // Images for this completion
  const completionImages = completion.images || [];
  const currentImage = completionImages[currentImageIndex];
  const hasMultipleImages = completionImages.length > 1;

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Reset state when completion changes
  useEffect(() => {
    setImageLoaded(false);
    setShowComments(openWithComments);
    setComments([]);
    setCurrentImageIndex(0); // Reset to first image of new completion
  }, [completion.id, openWithComments]);

  // Load comments when comments section is opened OR on desktop (always visible)
  useEffect(() => {
    const shouldLoadComments = isDesktop || showComments;
    if (!shouldLoadComments || comments.length > 0) return;

    const loadComments = async () => {
      setCommentsLoading(true);
      try {
        const result = await getComments(completion.id);
        if (result.success && result.data) {
          setComments(result.data);
        }
      } catch (error) {
        console.error('Error loading comments:', error);
      } finally {
        setCommentsLoading(false);
      }
    };

    loadComments();
  }, [showComments, completion.id, comments.length, isDesktop]);

  // Handle vote action
  const handleToggleComments = useCallback(() => {
    setShowComments((prev) => !prev);
  }, []);

  const handleCloseComments = useCallback(() => {
    setShowComments(false);
  }, []);

  const handleVote = async () => {
    setIsVoting(true);
    try {
      await onVote(completion.id);
    } finally {
      setIsVoting(false);
    }
  };

  // Keyboard navigation
  useKeyboardNav({
    enabled: isOpen,
    onClose,
    onPrevious: () => {
      if (hasMultipleImages && currentImageIndex > 0) {
        // Navigate within completion images
        setCurrentImageIndex((prev) => prev - 1);
      } else if (!isFirstCompletion) {
        // Navigate to previous completion
        onNavigate('prev');
      }
    },
    onNext: () => {
      if (hasMultipleImages && currentImageIndex < completionImages.length - 1) {
        // Navigate within completion images
        setCurrentImageIndex((prev) => prev + 1);
      } else if (!isLastCompletion) {
        // Navigate to next completion
        onNavigate('next');
      }
    },
  });

  // Touch handlers for swipe gestures (passive to avoid blocking scroll)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left - next image
      if (hasMultipleImages && currentImageIndex < completionImages.length - 1) {
        setCurrentImageIndex((prev) => prev + 1);
      } else if (!isLastCompletion) {
        onNavigate('next');
      }
    }

    if (isRightSwipe) {
      // Swipe right - previous image
      if (hasMultipleImages && currentImageIndex > 0) {
        setCurrentImageIndex((prev) => prev - 1);
      } else if (!isFirstCompletion) {
        onNavigate('prev');
      }
    }
  }, [
    touchStart,
    touchEnd,
    minSwipeDistance,
    hasMultipleImages,
    currentImageIndex,
    completionImages.length,
    isLastCompletion,
    isFirstCompletion,
    onNavigate,
  ]);

  // If no image is available or dialog is not open, don't render
  if (!isOpen || !currentImage) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-viewer-title"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-3 text-white transition-all hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black md:right-8 md:top-8"
        aria-label="Close viewer"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Previous button (completion navigation) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (hasMultipleImages && currentImageIndex > 0) {
            setCurrentImageIndex((prev) => prev - 1);
          } else {
            onNavigate('prev');
          }
        }}
        disabled={isFirstCompletion && currentImageIndex === 0}
        className={cn(
          'absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-all hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black',
          'md:left-8',
          isFirstCompletion &&
            currentImageIndex === 0 &&
            'cursor-not-allowed opacity-30 hover:bg-black/50'
        )}
        aria-label="Previous image"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Next button (completion navigation) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (hasMultipleImages && currentImageIndex < completionImages.length - 1) {
            setCurrentImageIndex((prev) => prev + 1);
          } else {
            onNavigate('next');
          }
        }}
        disabled={isLastCompletion && currentImageIndex === completionImages.length - 1}
        className={cn(
          'absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-all hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black',
          'md:right-8',
          isLastCompletion &&
            currentImageIndex === completionImages.length - 1 &&
            'cursor-not-allowed opacity-30 hover:bg-black/50'
        )}
        aria-label="Next image"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Main content area */}
      <div
        className={cn(
          'relative flex w-full flex-col items-center px-4 pb-8 pt-20 md:px-16',
          showComments ? 'min-h-full' : 'h-full justify-center'
        )}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Centered content wrapper */}
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center">
          {/* Image container */}
          <div
            ref={imageRef}
            className={cn(
              'relative mb-6 flex w-full items-center justify-center',
              showComments
                ? 'max-h-[50vh]'
                : 'max-h-[calc(100vh-28rem)] md:max-h-[calc(100vh-24rem)]'
            )}
          >
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
              </div>
            )}
            <Image
              src={currentImage.image_url}
              alt={currentImage.caption || `Photo by ${completion.participant.full_name}`}
              width={1920}
              height={1080}
              className={cn(
                'max-h-full w-auto rounded-lg object-contain shadow-2xl transition-opacity duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              priority
              loading="eager"
            />
          </div>

          {/* Thumbnail strip for multiple images - below image, hidden on mobile */}
          {hasMultipleImages && (
            <div className="mb-6 hidden w-full max-w-5xl md:block">
              <ImageThumbnailStrip
                images={completionImages}
                currentIndex={currentImageIndex}
                onSelect={(index) => {
                  setCurrentImageIndex(index);
                  setImageLoaded(false);
                }}
              />
            </div>
          )}

          {/* Metadata bar - below thumbnails */}
          <div className="mb-6 w-full max-w-5xl rounded-lg bg-gradient-to-t from-black/95 via-black/90 to-transparent p-4 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              {/* Participant info */}
              <div className="flex-1 space-y-2 text-white">
                <h2 id="image-viewer-title" className="text-xl font-bold md:text-2xl">
                  {completion.participant.full_name}
                </h2>
                <div className="flex flex-wrap gap-4 text-sm text-white/80">
                  <div>
                    <span className="font-medium">Startnr:</span>{' '}
                    {completion.participant.bib_number}
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
                  <p className="mt-2 text-sm text-white/90 md:text-base">{completion.comment}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                {/* Share button */}
                <ShareButton
                  shareData={createPhotoShareData(
                    completion.id,
                    completion.participant.full_name,
                    currentImage?.image_url
                  )}
                  variant="secondary"
                  size="lg"
                  showLabel={true}
                />

                {/* Comments button - hidden on desktop (md+) since comments always show */}
                <Button
                  onClick={handleToggleComments}
                  variant="secondary"
                  size="lg"
                  className="flex items-center gap-2 md:hidden"
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
                  variant={hasVoted ? 'default' : 'secondary'}
                  size="lg"
                  disabled={isVoting}
                  className="flex items-center gap-2"
                >
                  <Heart className={cn('h-5 w-5 transition-all', hasVoted && 'fill-current')} />
                  <span>{completion.vote_count || 0}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Comments section - below metadata, always visible on desktop */}
          {(isDesktop || showComments) && (
            <div
              className="mb-6 w-full max-w-5xl rounded-lg bg-background/95 p-4 shadow-2xl backdrop-blur-sm md:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Kommentarer</h3>
                {/* Close button only on mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseComments}
                  className="md:hidden"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {commentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-accent" />
                </div>
              ) : (
                <CommentList
                  completionId={completion.id}
                  initialComments={comments}
                  currentParticipantId={currentParticipantId}
                  isLoggedIn={isLoggedIn}
                />
              )}
            </div>
          )}
        </div>
        {/* Image counter within completion */}
        {hasMultipleImages && (
          <div className="absolute left-4 top-20 rounded-full bg-black/50 px-3 py-1 text-sm text-white md:left-8">
            {currentImageIndex + 1} / {completionImages.length}
          </div>
        )}
        {/* Completion counter */}
        <div className="absolute right-4 top-20 rounded-full bg-black/50 px-3 py-1 text-sm text-white md:right-8">
          Innsending {currentIndex + 1} / {totalImages}
        </div>
        {/* Caption if available */}
        {currentImage.caption && (
          <div className="absolute left-1/2 top-28 max-w-2xl -translate-x-1/2 rounded-lg bg-black/50 px-4 py-2 text-center text-sm text-white">
            {currentImage.caption}
          </div>
        )}
        i gu
      </div>
    </div>
  );
}
