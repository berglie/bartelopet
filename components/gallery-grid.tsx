'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Completion = {
  id: string;
  completed_date: string;
  duration_text: string | null;
  photo_url: string;
  comment: string | null;
  vote_count: number;
  participant: {
    id: string;
    full_name: string;
    bib_number: number;
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

  async function handleVote(completionId: string, participantId: string) {
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

    try {
      if (votedId) {
        // Remove existing vote
        await supabase
          .from('votes')
          .delete()
          .eq('voter_id', currentParticipant.id);
      }

      if (votedId !== completionId) {
        // Add new vote
        const { error } = await supabase
          .from('votes')
          .insert({
            voter_id: currentParticipant.id,
            completion_id: completionId,
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {completions.map((completion) => (
        <Card key={completion.id} className="overflow-hidden">
          <CardHeader className="p-0">
            <div className="relative aspect-square w-full">
              <Image
                src={completion.photo_url}
                alt={`${completion.participant.full_name}s løp`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
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
              <p className="text-sm mt-2">{completion.comment}</p>
            )}
          </CardContent>

          <CardFooter className="p-4 pt-0">
            <Button
              variant={votedId === completion.id ? 'default' : 'outline'}
              className="w-full flex items-center justify-center"
              onClick={() => handleVote(completion.id, completion.participant.id)}
              disabled={loading === completion.id}
            >
              <Heart
                className="mr-2 h-4 w-4"
                fill={votedId === completion.id ? 'currentColor' : 'none'}
              />
              {completion.vote_count} {completion.vote_count === 1 ? 'stemme' : 'stemmer'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
