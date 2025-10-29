'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { getCurrentEventYear } from '@/lib/utils/event-year';

export function CompletionForm({ participantId }: { participantId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Bildet er for stort. Maksimal størrelse er 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Filen må være et bilde');
      return;
    }

    setImageFile(file);
    setError('');

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!imageFile) {
      setError('Du må laste opp et bilde');
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('Du må være innlogget');
      setLoading(false);
      return;
    }

    try {
      // Upload image to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('completion-photos')
        .upload(fileName, imageFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Kunne ikke laste opp bilde');
        setLoading(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('completion-photos')
        .getPublicUrl(fileName);

      // Insert completion
      const { error: insertError } = await supabase
        .from('completions')
        .insert({
          participant_id: participantId,
          completed_date: formData.get('completed_date'),
          duration_text: formData.get('duration_text') || null,
          photo_url: publicUrl,
          comment: formData.get('comment') || null,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        setError('Kunne ikke registrere fullføring');
        setLoading(false);
        return;
      }

      router.refresh();
    } catch (err) {
      console.error('Error:', err);
      setError('Noe gikk galt. Prøv igjen.');
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
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
            <Label htmlFor="photo">Bilde fra løpet *</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Maks 5MB. Last opp skjermbilde fra løpeapp eller bilde fra løpet.
            </p>
          </div>

          {imagePreview && (
            <div className="relative aspect-video w-full max-w-md mx-auto overflow-hidden rounded-lg border">
              <img
                src={imagePreview}
                alt="Forhåndsvisning"
                className="object-cover w-full h-full"
              />
            </div>
          )}

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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Laster opp...' : 'Registrer fullføring'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
