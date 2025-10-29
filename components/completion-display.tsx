'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Upload } from 'lucide-react'
import { EditFieldDialog } from '@/components/edit-field-dialog'
import { EditPhotoDialog } from '@/components/edit-photo-dialog'
import { useRouter } from 'next/navigation'

type Completion = {
  id: string
  participant_id: string
  completed_date: string
  duration_text: string | null
  photo_url: string
  comment: string | null
  vote_count: number
}

export function CompletionDisplay({ completion }: { completion: Completion }) {
  const router = useRouter()
  const [editingField, setEditingField] = useState<'date' | 'time' | 'comment' | null>(null)
  const [editingPhoto, setEditingPhoto] = useState(false)

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Photo with edit button */}
            <div className="relative aspect-square w-full overflow-hidden rounded-lg group">
              <Image
                src={completion.photo_url}
                alt="Ditt fullførte løp"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <Button
                onClick={() => setEditingPhoto(true)}
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Upload className="h-4 w-4 mr-2" />
                Endre bilde
              </Button>
            </div>

            <div className="space-y-4">
              {/* Date field */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-muted-foreground">Dato</h3>
                  <p className="text-lg">
                    {new Date(completion.completed_date).toLocaleDateString('nb-NO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Button
                  onClick={() => setEditingField('date')}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 flex-shrink-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              {/* Time field */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-muted-foreground">Tid</h3>
                  <p className="text-lg">{completion.duration_text || 'Ikke angitt'}</p>
                </div>
                <Button
                  onClick={() => setEditingField('time')}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 flex-shrink-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              {/* Comment field */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-muted-foreground">Kommentar</h3>
                  <p className="text-lg">{completion.comment || 'Ingen kommentar'}</p>
                </div>
                <Button
                  onClick={() => setEditingField('comment')}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 flex-shrink-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              {/* Votes (read-only) */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground">Stemmer</h3>
                <p className="text-3xl font-bold text-accent">{completion.vote_count}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialogs */}
      {editingField && (
        <EditFieldDialog
          isOpen={true}
          onClose={() => setEditingField(null)}
          completion={completion}
          field={editingField}
          onSuccess={handleSuccess}
        />
      )}

      {editingPhoto && (
        <EditPhotoDialog
          isOpen={true}
          onClose={() => setEditingPhoto(false)}
          completion={completion}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
