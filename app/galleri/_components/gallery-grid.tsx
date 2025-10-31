'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/app/_shared/components/ui/card';
import { Button } from '@/app/_shared/components/ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { createClient } from '@/app/_shared/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ImageViewerDialog } from './image-viewer-dialog';
import type { CompletionWithParticipant } from '@/app/_shared/lib/types/database';

type Completion = {
  id: string;
  completed_date: string;
  duration_text: string | null;
  photo_url: string;
  comment: string | null;
  vote_count: number;
  comment_count: number;
  event_year: number;
  participant: {
    id: string;
    user_id: string | null;
    email: string;
    full_name: string;
    postal_address: string;
    phone_number: string | null;
    bib_number: number;
    has_completed: boolean;
    created_at: string;
    updated_at: string;
  };
};

export function GalleryGrid({
  completions,
  userVoteId,
}: {
  completions: Completion[];
  userVoteId: string | null;
}) {
  const router = useRouter();
  const [votedId, setVotedId] = useState(userVoteId);
  const [loading, setLoading] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [openWithComments, setOpenWithComments] = useState(false);

  // Fetch current user ID
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  const handleImageClick = useCallback((index: number, withComments = false) => {
    setCurrentImageIndex(index);
    setOpenWithComments(withComments);
    setViewerOpen(true);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setViewerOpen(false);
  }, []);

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    setCurrentImageIndex((prev) => {
      if (direction === 'prev') {
        return prev > 0 ? prev - 1 : prev;
      } else {
        return prev < completions.length - 1 ? prev + 1 : prev;
      }
    });
  }, [completions.length]);

  const handleVote = useCallback(async (completionId: string) => {
    const supabase = createClient();

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Get participant ID
    const { data: currentParticipant } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!currentParticipant) {
      alert('Du må være registrert for å stemme');
      return;
    }

    // Find the completion to check ownership
    const completion = completions.find(c => c.id === completionId);
    if (completion && currentParticipant.id === completion.participant.id) {
      alert('Du kan ikke stemme på ditt eget bilde');
      return;
    }

    try {
      if (votedId) {
        // Remove existing vote
        await supabase
          .from('photo_votes')
          .delete()
          .eq('voter_id', currentParticipant.id);
      }

      if (votedId !== completionId) {
        // Add new vote
        const { error } = await supabase
          .from('photo_votes')
          .insert({
            voter_id: currentParticipant.id,
            completion_id: completionId,
            event_year: completion?.event_year || 2025,
          });

        if (error) {
          console.error('Vote error:', error);
          alert('Kunne ikke registrere stemme');
        } else {
          setVotedId(completionId);
        }
      } else {
        setVotedId(null);
      }

      router.refresh();
    } catch (error) {
      console.error('Vote error:', error);
      alert('Noe gikk galt');
    }
  }, [votedId, completions, router]);

  async function handleQuickVote(completionId: string, participantId: string) {
    setLoading(completionId);

    const supabase = createClient();

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Get participant ID
    const { data: currentParticipant } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!currentParticipant) {
      alert('Du må være registrert for å stemme');
      setLoading(null);
      return;
    }

    // Check if trying to vote for own completion
    if (currentParticipant.id === participantId) {
      alert('Du kan ikke stemme på ditt eget bilde');
      setLoading(null);
      return;
    }

    // Find the completion to get event_year
    const completion = completions.find(c => c.id === completionId);

    try {
      if (votedId) {
        // Remove existing vote
        await supabase
          .from('photo_votes')
          .delete()
          .eq('voter_id', currentParticipant.id);
      }

      if (votedId !== completionId) {
        // Add new vote
        const { error } = await supabase
          .from('photo_votes')
          .insert({
            voter_id: currentParticipant.id,
            completion_id: completionId,
            event_year: completion?.event_year || 2025,
          });

        if (error) {
          console.error('Vote error:', error);
          alert('Kunne ikke registrere stemme');
        } else {
          setVotedId(completionId);
        }
      } else {
        setVotedId(null);
      }

      router.refresh();
    } catch (error) {
      console.error('Vote error:', error);
      alert('Noe gikk galt');
    } finally {
      setLoading(null);
    }
  }

  const currentCompletion = completions[currentImageIndex] as CompletionWithParticipant;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {completions.map((completion, index) => (
          <Card key={completion.id} className="overflow-hidden">
            <CardHeader className="p-0">
              <div
                className="relative aspect-square w-full cursor-pointer group"
                onClick={() => handleImageClick(index)}
              >
                <Image
                  src={completion.photo_url}
                  alt={`${completion.participant.full_name}s løp`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                    Klikk for å se større
                  </span>
                </div>
              </div>
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
                variant={votedId === completion.id ? 'default' : 'outline'}
                className="flex-1 flex items-center justify-center"
                onClick={() => handleQuickVote(completion.id, completion.participant.id)}
                disabled={loading === completion.id}
              >
                <Heart
                  className="mr-2 h-4 w-4"
                  fill={votedId === completion.id ? 'currentColor' : 'none'}
                />
                {completion.vote_count}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageClick(index, true);
                }}
                className="flex items-center gap-1"
              >
                <MessageCircle className="h-4 w-4" />
                {completion.comment_count > 0 && (
                  <span className="text-xs">{completion.comment_count}</span>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {viewerOpen && (
        <ImageViewerDialog
          isOpen={viewerOpen}
          onClose={handleCloseViewer}
          completion={currentCompletion}
          currentIndex={currentImageIndex}
          onNavigate={handleNavigate}
          onVote={handleVote}
          userVoteId={votedId}
          totalImages={completions.length}
          currentUserId={currentUserId}
          openWithComments={openWithComments}
        />
      )}
    </>
  );
}
