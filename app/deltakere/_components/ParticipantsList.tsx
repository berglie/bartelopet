'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/app/_shared/components/ui/card';
import { Check, User } from 'lucide-react';
import type { ParticipantListItem } from '../_utils/queries';
import { ParticipantDetailModal } from './ParticipantDetailModal';

interface ParticipantsListProps {
  participants: ParticipantListItem[];
}

export function ParticipantsList({ participants }: ParticipantsListProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantListItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleParticipantClick = (participant: ParticipantListItem) => {
    setSelectedParticipant(participant);
    setModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Alle deltakere</CardTitle>
          <CardDescription>Klikk på en deltaker for å se mer informasjon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {participants.map((participant) => (
              <div
                key={participant.bib_number}
                className="group flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                onClick={() => handleParticipantClick(participant)}
              >
                <div className="flex items-center gap-2 md:gap-4">
                  <span className="min-w-[40px] font-mono text-sm font-semibold text-accent md:min-w-[60px] md:text-base">
                    #{participant.bib_number}
                  </span>
                  <span className="text-sm font-medium md:text-base">{participant.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {participant.has_completed && (
                    <div className="flex items-center gap-1 text-green-600">
                      <span className="text-lg md:text-xl">🏆</span>
                      <Check className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="hidden text-xs font-medium sm:inline md:text-sm">
                        Fullført
                      </span>
                    </div>
                  )}
                  <User className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
              </div>
            ))}
          </div>

          {participants.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">Ingen deltakere ennå</div>
          )}
        </CardContent>
      </Card>

      <ParticipantDetailModal
        participant={selectedParticipant}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
