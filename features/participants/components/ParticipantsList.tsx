import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Check } from 'lucide-react'
import type { ParticipantListItem } from '../server/queries'

interface ParticipantsListProps {
  participants: ParticipantListItem[]
}

export function ParticipantsList({ participants }: ParticipantsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alle deltakere</CardTitle>
        <CardDescription>Sortert etter startnummer</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {participants.map((participant) => (
            <div
              key={participant.bib_number}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono font-semibold text-accent min-w-[60px]">
                  #{participant.bib_number}
                </span>
                <span className="font-medium">{participant.full_name}</span>
              </div>
              {participant.has_completed && (
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-xl">🏆</span>
                  <Check className="h-5 w-5" />
                  <span className="text-sm font-medium">Fullført</span>
                </div>
              )}
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
  )
}