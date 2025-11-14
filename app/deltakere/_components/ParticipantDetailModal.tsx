'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/_shared/components/ui/dialog';
import { Badge } from '@/app/_shared/components/ui/badge';
import {
  Trophy,
  Clock,
  Calendar,
  MessageCircle,
  User,
  Hash,
  ImageIcon,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import type { ParticipantListItem, ParticipantDetail } from '../_utils/queries';
import { getParticipantDetailAction } from '@/app/actions/participants';
import { cn } from '@/app/_shared/lib/utils/cn';
import Link from 'next/link';
import { Button } from '@/app/_shared/components/ui/button';

interface ParticipantDetailModalProps {
  participant: ParticipantListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ParticipantDetailModal({
  participant,
  open,
  onOpenChange,
}: ParticipantDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ParticipantDetail | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch participant details when modal opens
  useEffect(() => {
    const fetchParticipantDetail = async () => {
      if (!participant) return;

      setLoading(true);
      try {
        const data = await getParticipantDetailAction(
          participant.bib_number,
          participant.event_year
        );

        if (data) {
          setDetail(data);
        }
      } catch (error) {
        console.error('Error fetching participant detail:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open && participant) {
      fetchParticipantDetail();
    } else {
      // Reset state when modal closes
      setDetail(null);
      setSelectedImageIndex(0);
    }
  }, [open, participant]);

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Ikke registrert';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}t ${mins}min` : `${mins} min`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-h-[85vh] sm:max-w-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Deltakerinformasjon</DialogTitle>
          <DialogDescription>Detaljert informasjon om deltaker</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : detail ? (
          <div className="flex h-full flex-col overflow-hidden">
            {/* Header - Fixed */}
            <div className="shrink-0 border-b p-4 sm:p-6">
              <h2 className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-accent sm:h-5 sm:w-5" />
                  <span className="font-mono text-base text-accent sm:text-lg">
                    {detail.bib_number}
                  </span>
                </div>
                <span className="text-base font-semibold text-foreground sm:text-lg">
                  {detail.full_name}
                </span>
              </h2>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <Badge variant={detail.has_completed ? 'success' : 'secondary'} className="w-fit">
                  {detail.has_completed ? 'Fullført' : 'Ikke fullført'}
                </Badge>
                <span className="text-xs text-muted-foreground sm:text-sm">
                  Påmeldt {format(new Date(detail.created_at), 'd. MMMM yyyy', { locale: nb })}
                </span>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {/* Completion details if available */}
              {detail.completion ? (
                <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
                  {/* Images */}
                  {detail.completion.images && detail.completion.images.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted sm:aspect-[4/3]">
                        <Image
                          src={detail.completion.images[selectedImageIndex].image_url}
                          alt={`Bilde fra ${detail.full_name}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>

                      {/* Image thumbnails if multiple */}
                      {detail.completion.images.length > 1 && (
                        <div className="space-y-2">
                          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <p className="text-xs text-muted-foreground sm:text-sm">
                              {detail.completion.images.length} bilder totalt
                            </p>
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs sm:gap-2 sm:text-sm"
                            >
                              <Link href={`/galleri?year=${detail.event_year}`}>
                                <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                Se i galleri
                                <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Link>
                            </Button>
                          </div>

                          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                            {detail.completion.images.map((img, idx) => (
                              <button
                                key={img.id}
                                onClick={() => setSelectedImageIndex(idx)}
                                className={cn(
                                  'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors sm:h-20 sm:w-20',
                                  idx === selectedImageIndex
                                    ? 'border-accent'
                                    : 'border-transparent hover:border-muted-foreground'
                                )}
                              >
                                <Image
                                  src={img.image_url}
                                  alt={`Miniatyr ${idx + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 64px, 80px"
                                />
                                {img.is_starred && (
                                  <div className="absolute right-0.5 top-0.5 rounded-full bg-accent p-0.5 sm:p-1">
                                    <Trophy className="h-2.5 w-2.5 text-accent-foreground sm:h-3 sm:w-3" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Single image - show gallery link */}
                      {detail.completion.images.length === 1 && (
                        <div className="flex justify-end">
                          <Button asChild variant="outline" size="sm" className="gap-2">
                            <Link href={`/galleri?year=${detail.event_year}`}>
                              <ImageIcon className="h-4 w-4" />
                              Se i galleri
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      )}

                      {/* Image caption if available */}
                      {detail.completion.images[selectedImageIndex].caption && (
                        <p className="text-sm italic text-muted-foreground">
                          {detail.completion.images[selectedImageIndex].caption}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-muted/30 p-8 text-center">
                      <ImageIcon className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Ingen bilder lastet opp</p>
                    </div>
                  )}

                  {/* Completion stats */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 sm:gap-3">
                      <Calendar className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground sm:text-sm">Fullført</p>
                        <p className="truncate text-sm font-medium sm:text-base">
                          {format(new Date(detail.completion.completion_date), 'd. MMMM yyyy', {
                            locale: nb,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 sm:gap-3">
                      <Clock className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground sm:text-sm">Tid brukt</p>
                        <p className="text-sm font-medium sm:text-base">
                          {formatDuration(detail.completion.duration_minutes)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Participant's submission comment */}
                  {detail.completion.submission_comment && (
                    <div className="space-y-2 rounded-lg bg-muted/30 p-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <MessageCircle className="h-4 w-4" />
                        Kommentar fra deltaker
                      </h3>
                      <p className="text-sm italic">
                        &ldquo;{detail.completion.submission_comment}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 sm:p-6">
                  <div className="space-y-4 py-8 text-center sm:py-12">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted sm:h-20 sm:w-20">
                      <User className="h-8 w-8 text-muted-foreground sm:h-10 sm:w-10" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-base font-medium sm:text-lg">Ikke fullført ennå</p>
                      <p className="px-4 text-xs text-muted-foreground sm:text-sm">
                        Denne deltakeren har ikke lastet opp bilder ennå
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            Kunne ikke laste deltakerinformasjon
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
