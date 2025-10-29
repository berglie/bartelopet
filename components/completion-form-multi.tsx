'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { getCurrentEventYear } from '@/lib/utils/event-year'
import { MultiImageUpload, type ImageUploadState } from '@/components/multi-image-upload'
import { uploadCompletionImages } from '@/app/actions/completion-images'
import { createClient } from '@/lib/supabase/client'
import { validateStarSelection } from '@/lib/constants/images'

export function CompletionFormMulti({ participantId }: { participantId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [images, setImages] = useState<ImageUploadState[]>([])
  const [uploadProgress, setUploadProgress] = useState<number>(0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUploadProgress(0)

    // Validate images
    if (images.length === 0) {
      setError('Du må laste opp minst ett bilde')
      setLoading(false)
      return
    }

    // Validate star selection
    const starValidation = validateStarSelection(images)
    if (!starValidation.valid) {
      setError(starValidation.errors[0]?.message || 'Ugyldig bildevalg')
      setLoading(false)
      return
    }

    const formData = new FormData(e.currentTarget)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Du må være innlogget')
      setLoading(false)
      return
    }

    try {
      // First, create the completion record with the starred image
      const starredImage = images.find((img) => img.isStarred)!
      const fileExt = starredImage.file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Upload starred image to get initial photo_url
      const { error: uploadError } = await supabase.storage
        .from('completion-photos')
        .upload(fileName, starredImage.file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setError('Kunne ikke laste opp bilde')
        setLoading(false)
        return
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('completion-photos').getPublicUrl(fileName)

      // Insert completion with event year
      const eventYear = getCurrentEventYear()
      const { data: completion, error: insertError } = await supabase
        .from('completions')
        .insert({
          participant_id: participantId,
          completed_date: formData.get('completed_date'),
          duration_text: formData.get('duration_text') || null,
          photo_url: publicUrl, // Temporary, will be updated by trigger
          comment: formData.get('comment') || null,
          event_year: eventYear,
        })
        .select('id')
        .single()

      if (insertError || !completion) {
        console.error('Insert error:', insertError)
        setError('Kunne ikke registrere fullføring')
        setLoading(false)
        return
      }

      // Now upload all images via the new multi-image system
      setUploadProgress(30)

      // Prepare image data for upload
      const imageData = await Promise.all(
        images.map(async (image) => {
          return {
            fileData: image.preview, // Base64 data URL
            fileName: image.file.name,
            fileType: image.file.type,
            caption: image.caption,
          }
        })
      )

      setUploadProgress(50)

      // Find the index of the starred image
      const starredIndex = images.findIndex((img) => img.isStarred)

      // Upload all images
      const uploadResult = await uploadCompletionImages(completion.id, imageData, starredIndex)

      if (!uploadResult.success) {
        console.error('Multi-image upload error:', uploadResult.error)
        setError(uploadResult.error || 'Kunne ikke laste opp bilder')
        setLoading(false)
        return
      }

      setUploadProgress(100)

      // Success! Redirect to dashboard
      router.push('/min-side')
      router.refresh()
    } catch (err) {
      console.error('Error:', err)
      setError('Noe gikk galt. Prøv igjen.')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="completed_date">Dato for fullføring *</Label>
            <Input
              id="completed_date"
              name="completed_date"
              type="date"
              required
              min={`${getCurrentEventYear()}-01-01`}
              max={new Date().toISOString().split('T')[0]}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_text">Tid (valgfritt)</Label>
            <Input
              id="duration_text"
              name="duration_text"
              placeholder="f.eks. 1:05:23 eller 1 time 5 minutter"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Bilder fra løpet *</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Last opp ett eller flere bilder. Velg hovedbilde ved å klikke på stjernen.
            </p>
            <MultiImageUpload
              images={images}
              onImagesChange={setImages}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Kommentar eller historie (valgfritt)</Label>
            <Textarea
              id="comment"
              name="comment"
              placeholder="Fortell om løpet ditt..."
              rows={4}
              maxLength={500}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">Maks 500 tegn</p>
          </div>

          {loading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Laster opp...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || images.length === 0}>
            {loading ? 'Laster opp...' : 'Registrer fullføring'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
