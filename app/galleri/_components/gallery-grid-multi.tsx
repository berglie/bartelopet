'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader } from '@/app/_shared/components/ui/card'
import { Button } from '@/app/_shared/components/ui/button'
import { Heart, MessageCircle, Star } from 'lucide-react'
import { createClient } from '@/app/_shared/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ImageViewerDialogMulti } from './image-viewer-dialog-multi'
import { AdditionalImagesIndicator } from './additional-images-indicator'
import { ShareButton } from './share-button'
import { createPhotoShareData } from '@/app/_shared/lib/utils/share'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/_shared/components/ui/alert-dialog'
import type { CompletionWithParticipant, CompletionImage } from '@/app/_shared/lib/types/database'

type Completion = {
  id: string
  completed_date: string
  duration_text: string | null
  comment: string | null
  vote_count: number
  comment_count: number
  image_count: number
  event_year: number
  participant: {
    id: string
    user_id: string | null
    email: string
    full_name: string
    postal_address: string
    phone_number: string | null
    bib_number: number
    has_completed: boolean
    created_at: string
    updated_at: string
  }
  images: CompletionImage[]
}

type CompletionWithImages = Completion

export function GalleryGridMulti({
  completions,
  userVoteIds,
  initialCompletionId,
}: {
  completions: Completion[]
  userVoteIds: string[]
  initialCompletionId?: string | null
}) {
  const router = useRouter()
  const [votedIds, setVotedIds] = useState(userVoteIds)
  const [loading, setLoading] = useState<string | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null)
  const [openWithComments, setOpenWithComments] = useState(false)
  const [completionsWithImages, setCompletionsWithImages] = useState<CompletionWithImages[]>([])
  const [loadingImages, setLoadingImages] = useState(true)

  // Track if we've already handled the initial completion ID
  const hasHandledInitialCompletion = useRef(false)

  // Alert dialog states
  type AlertType = 'not-registered' | 'own-vote' | 'error' | null
  const [alertType, setAlertType] = useState<AlertType>(null)

  // Fetch current user ID and participant ID
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      // Fetch participant ID if user is logged in
      if (user) {
        const { data: participant } = await supabase
          .from('participants')
          .select('id')
          .eq('user_id', user.id)
          .single()
        setCurrentParticipantId(participant?.id || null)
      } else {
        setCurrentParticipantId(null)
      }
    }
    fetchUser()
  }, [])

  // Set completions directly since images are already fetched
  useEffect(() => {
    setCompletionsWithImages(completions)
    setLoadingImages(false)
  }, [completions])

  // Open viewer if initialCompletionId is provided (only once)
  useEffect(() => {
    if (
      initialCompletionId &&
      completionsWithImages.length > 0 &&
      !hasHandledInitialCompletion.current
    ) {
      const index = completionsWithImages.findIndex((c) => c.id === initialCompletionId)
      if (index !== -1) {
        setCurrentImageIndex(index)
        setViewerOpen(true)
        hasHandledInitialCompletion.current = true
      }
    }
  }, [initialCompletionId, completionsWithImages])

  const handleImageClick = useCallback((index: number, withComments = false) => {
    // Update state immediately for instant UI response
    setCurrentImageIndex(index)
    setOpenWithComments(withComments)
    setViewerOpen(true)
    // URL update will happen in the useEffect below (line 163)
  }, [])

  const handleCommentClick = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    handleImageClick(index, true)
  }, [handleImageClick])

  const handleThumbnailClick = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    handleImageClick(index)
  }, [handleImageClick])

  const handleCloseViewer = useCallback(() => {
    setViewerOpen(false)

    // Defer URL update to next tick to avoid blocking the main thread
    if (typeof window !== 'undefined') {
      const updateUrl = () => {
        const url = new URL(window.location.href)
        url.searchParams.delete('id')
        window.history.replaceState({}, '', url.toString())
      }

      if ('requestIdleCallback' in window) {
        requestIdleCallback(updateUrl, { timeout: 100 })
      } else {
        setTimeout(updateUrl, 0)
      }
    }
  }, [])

  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      setCurrentImageIndex((prev) => {
        if (direction === 'prev') {
          return prev > 0 ? prev - 1 : prev
        } else {
          return prev < completionsWithImages.length - 1 ? prev + 1 : prev
        }
      })
    },
    [completionsWithImages]
  )

  // Update URL when currentImageIndex changes (separate from state update)
  // Deferred to avoid blocking the main thread during navigation
  useEffect(() => {
    if (viewerOpen && completionsWithImages[currentImageIndex]) {
      const completionId = completionsWithImages[currentImageIndex].id
      if (typeof window !== 'undefined') {
        const updateUrl = () => {
          const url = new URL(window.location.href)
          url.searchParams.set('id', completionId)
          window.history.replaceState({}, '', url.toString())
        }

        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
          requestIdleCallback(updateUrl, { timeout: 100 })
        } else {
          setTimeout(updateUrl, 0)
        }
      }
    }
  }, [currentImageIndex, viewerOpen, completionsWithImages])

  const handleQuickVote = useCallback(async (completionId: string, participantId: string) => {
    setLoading(completionId)

    try {
      const supabase = createClient()

      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get participant ID
      const { data: currentParticipant } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!currentParticipant) {
        setAlertType('not-registered')
        return
      }

      // Check if voting for own completion
      if (currentParticipant.id === participantId) {
        setAlertType('own-vote')
        return
      }

      // Find the completion to get event_year
      const completion = completionsWithImages.find((c) => c.id === completionId)
      const eventYear = completion?.event_year || 2025

      // Check if already voted for this completion
      const { data: existingVote } = await supabase
        .from('photo_votes')
        .select('id')
        .eq('voter_id', currentParticipant.id)
        .eq('completion_id', completionId)
        .eq('event_year', eventYear)
        .maybeSingle()

      if (existingVote) {
        // Remove vote
        await supabase.from('photo_votes').delete().eq('id', existingVote.id)
        setVotedIds((prev) => prev.filter((id) => id !== completionId))
        // Update vote count locally
        setCompletionsWithImages((prev) =>
          prev.map((c) =>
            c.id === completionId ? { ...c, vote_count: Math.max(0, c.vote_count - 1) } : c
          )
        )
      } else {
        // Create new vote
        await supabase.from('photo_votes').insert({
          voter_id: currentParticipant.id,
          completion_id: completionId,
          event_year: eventYear,
        })
        setVotedIds((prev) => [...prev, completionId])
        // Update vote count locally
        setCompletionsWithImages((prev) =>
          prev.map((c) =>
            c.id === completionId ? { ...c, vote_count: c.vote_count + 1 } : c
          )
        )
      }

      router.refresh()
    } catch (error) {
      console.error('Vote error:', error)
      setAlertType('error')
    } finally {
      setLoading(null)
    }
  }, [router, completionsWithImages])

  const handleVote = useCallback(
    async (completionId: string) => {
      const completion = completionsWithImages.find((c) => c.id === completionId)
      if (completion) {
        await handleQuickVote(completionId, completion.participant.id)
      }
    },
    [completionsWithImages, handleQuickVote]
  )

  const currentCompletion = completionsWithImages[currentImageIndex] as
    | (CompletionWithParticipant & { images: CompletionImage[] })
    | undefined

  if (loadingImages) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-accent" />
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {completionsWithImages.map((completion, index) => {
          const starredImage = completion.images.find((img) => img.is_starred)
          const additionalImageCount = completion.images.length - 1

          return (
            <Card key={completion.id} className="overflow-hidden">
              <CardHeader className="p-0">
                <div
                  className="relative aspect-square w-full cursor-pointer group"
                  onClick={() => handleImageClick(index)}
                >
                  {/* Main starred image */}
                  {starredImage ? (
                    <Image
                      src={starredImage.image_url}
                      alt={`${completion.participant.full_name}s løp`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      priority={index === 0}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <p className="text-muted-foreground">Ingen bilder</p>
                    </div>
                  )}

                  {/* Starred badge */}
                  {starredImage && completion.images.length > 1 && (
                    <div className="absolute top-2 left-2 bg-accent text-accent-foreground rounded-full p-1.5 shadow-lg">
                      <Star className="h-3 w-3 fill-current" />
                    </div>
                  )}

                  {/* Hover overlay - hidden on mobile */}
                  <div className="hidden md:flex absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                      Klikk for å se{completion.images.length > 1 ? ' alle bilder' : ' større'}
                    </span>
                  </div>

                  {/* Additional images indicator */}
                  {additionalImageCount > 0 && (
                    <AdditionalImagesIndicator
                      count={additionalImageCount}
                      onViewAll={() => handleImageClick(index)}
                    />
                  )}
                </div>

                {/* Thumbnail strip (clickable previews) - hidden on mobile to avoid overlay issues */}
                {completion.images.length > 1 && (
                  <div className="hidden md:flex gap-1 p-2 bg-muted/50">
                    {completion.images.slice(0, 4).map((img, imgIndex) => (
                      <button
                        key={img.id}
                        onClick={(e) => handleThumbnailClick(e, index)}
                        className="relative w-12 h-12 rounded-sm overflow-hidden flex-shrink-0 border border-border cursor-pointer transition-all hover:ring-2 hover:ring-accent hover:scale-105"
                        title={`Se bilde ${imgIndex + 1}`}
                      >
                        <Image src={img.image_url} alt="" fill className="object-cover" sizes="48px" />
                        {img.is_starred && (
                          <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                            <Star className="h-3 w-3 fill-accent text-accent" />
                          </div>
                        )}
                      </button>
                    ))}
                    {completion.images.length > 4 && (
                      <button
                        onClick={(e) => handleThumbnailClick(e, index)}
                        className="w-12 h-12 rounded-sm bg-muted flex items-center justify-center text-xs font-medium border border-border cursor-pointer transition-all hover:ring-2 hover:ring-accent hover:scale-105"
                        title="Se alle bilder"
                      >
                        +{completion.images.length - 4}
                      </button>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{completion.participant.full_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Startnummer {completion.participant.bib_number}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground mb-2">
                  <p>
                    {new Date(completion.completed_date).toLocaleDateString('nb-NO')}
                    {completion.duration_text && ` · ${completion.duration_text}`}
                  </p>
                </div>

                {completion.comment && (
                  <p className="text-sm mt-2 line-clamp-2">{completion.comment}</p>
                )}
              </CardContent>

              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button
                  variant={votedIds.includes(completion.id) ? 'default' : 'outline'}
                  className="flex-1 flex items-center justify-center"
                  onClick={() => handleQuickVote(completion.id, completion.participant.id)}
                  disabled={loading === completion.id}
                >
                  <Heart
                    className="mr-2 h-4 w-4"
                    fill={votedIds.includes(completion.id) ? 'currentColor' : 'none'}
                  />
                  {completion.vote_count}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => handleCommentClick(e, index)}
                  className="flex items-center gap-1"
                >
                  <MessageCircle className="h-4 w-4" />
                  {completion.comment_count > 0 && (
                    <span className="text-xs">{completion.comment_count}</span>
                  )}
                </Button>

                <ShareButton
                  shareData={createPhotoShareData(
                    completion.id,
                    completion.participant.full_name,
                    starredImage?.image_url
                  )}
                  variant="outline"
                  size="icon"
                  showLabel={false}
                />
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {viewerOpen && currentCompletion && (
        <ImageViewerDialogMulti
          isOpen={viewerOpen}
          onClose={handleCloseViewer}
          completion={currentCompletion}
          currentIndex={currentImageIndex}
          onNavigate={handleNavigate}
          onVote={handleVote}
          userVoteIds={votedIds}
          totalImages={completionsWithImages.length}
          currentParticipantId={currentParticipantId}
          isLoggedIn={currentUserId !== null}
          openWithComments={openWithComments}
        />
      )}

      {/* Alert Dialogs */}
      <AlertDialog open={alertType === 'not-registered'} onOpenChange={() => setAlertType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ikke registrert</AlertDialogTitle>
            <AlertDialogDescription>
              Du må være registrert som deltaker for å stemme på løp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertType(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={alertType === 'own-vote'} onOpenChange={() => setAlertType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kan ikke stemme på eget løp</AlertDialogTitle>
            <AlertDialogDescription>
              Du kan ikke stemme på ditt eget løp. Velg en annen innsending for å stemme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertType(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={alertType === 'error'} onOpenChange={() => setAlertType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Noe gikk galt</AlertDialogTitle>
            <AlertDialogDescription>
              Det oppstod en feil under stemming. Vennligst prøv igjen senere.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertType(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
