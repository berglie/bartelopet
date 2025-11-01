'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_shared/components/ui/card'
import { Check, User } from 'lucide-react'
import type { ParticipantListItem } from '../_utils/queries'
import { ParticipantDetailModal } from './ParticipantDetailModal'

interface ParticipantsListProps {
  participants: ParticipantListItem[]
}

export function ParticipantsList({ participants }: ParticipantsListProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantListItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleParticipantClick = (participant: ParticipantListItem) => {
    setSelectedParticipant(participant)
    setModalOpen(true)
  }

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
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => handleParticipantClick(participant)}
              >
                <div className="flex items-center gap-2 md:gap-4">
                  <span className="font-mono font-semibold text-accent min-w-[40px] md:min-w-[60px] text-sm md:text-base">
                    #{participant.bib_number}
                  </span>
                  <span className="font-medium text-sm md:text-base">{participant.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {participant.has_completed && (
                    <div className="flex items-center gap-1 text-green-600">
                      <span className="text-lg md:text-xl">🏆</span>
                      <Check className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="text-xs md:text-sm font-medium hidden sm:inline">Fullført</span>
                    </div>
                  )}
                  <User className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            ))}
          </div>

          {participants.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Ingen deltakere ennå
            </div>
          )}
        </CardContent>
      </Card>

      <ParticipantDetailModal
        participant={selectedParticipant}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )
}