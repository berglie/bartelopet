'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

export function SubmissionForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Bildet er for stort. Maksimal størrelse er 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Filen må være et bilde');
      return;
    }

    setImageFile(file);
    setError('');

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

    try {
      // First, send magic link for authentication
      const email = formData.get('email') as string;
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError('Kunne ikke sende innloggingslenke');
        setLoading(false);
        return;
      }

      // Generate bib number
      const { data: maxBib } = await supabase
        .from('participants')
        .select('bib_number')
        .order('bib_number', { ascending: false })
        .limit(1)
        .single();

      const bibNumber = maxBib ? maxBib.bib_number + 1 : 1001;

      // Create participant
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .insert({
          full_name: formData.get('full_name') as string,
          email: email,
          postal_address: formData.get('postal_address') as string,
          phone_number: formData.get('phone_number') as string || null,
          bib_number: bibNumber,
        })
        .select()
        .single();

      if (participantError) {
        if (participantError.code === '23505') {
          setError('Denne e-postadressen er allerede registrert');
        } else {
          setError('Kunne ikke registrere deltaker');
        }
        setLoading(false);
        return;
      }

      // Upload image
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${participant.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('completion-photos')
        .upload(fileName, imageFile);

      if (uploadError) {
        setError('Kunne ikke laste opp bilde');
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('completion-photos')
        .getPublicUrl(fileName);

      // Create completion
      await supabase
        .from('completions')
        .insert({
          participant_id: participant.id,
          completed_date: formData.get('completed_date') as string,
          duration_text: formData.get('duration_text') as string || null,
          photo_url: publicUrl,
          comment: formData.get('comment') as string || null,
        });

      // Show success and redirect
      router.push(`/takk?bib=${bibNumber}`);
    } catch (err) {
      setError('Noe gikk galt. Prøv igjen.');
      setLoading(false);
    }
  }

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-accent">Din informasjon</h3>

            <div className="space-y-2">
              <Label htmlFor="full_name">Fullt navn *</Label>
              <Input
                id="full_name"
                name="full_name"
                required
                placeholder="Ola Nordmann"
                disabled={loading}
                className="bg-input/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-postadresse *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="ola@example.com"
                disabled={loading}
                className="bg-input/50"
              />
              <p className="text-xs text-muted-foreground">
                Du vil motta innloggingslenke på denne adressen
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_address">Postadresse *</Label>
              <Input
                id="postal_address"
                name="postal_address"
                required
                placeholder="Gateveien 1, 4000 Stavanger"
                disabled={loading}
                className="bg-input/50"
              />
              <p className="text-xs text-muted-foreground">
                Medaljen sendes til denne adressen
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Telefonnummer (valgfritt)</Label>
              <Input
                id="phone_number"
                name="phone_number"
                type="tel"
                placeholder="12345678"
                disabled={loading}
                className="bg-input/50"
              />
            </div>
          </div>

          <div className="border-t border-border/50 pt-6" />

          {/* Run Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-accent">Detaljer fra løpet</h3>

            <div className="space-y-2">
              <Label htmlFor="completed_date">Dato fullført *</Label>
              <Input
                id="completed_date"
                name="completed_date"
                type="date"
                required
                min="2025-11-01"
                max={new Date().toISOString().split('T')[0]}
                disabled={loading}
                className="bg-input/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_text">Tid (valgfritt)</Label>
              <Input
                id="duration_text"
                name="duration_text"
                placeholder="f.eks. 1:05:23 eller 1 time 5 minutter"
                disabled={loading}
                className="bg-input/50"
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
                className="bg-input/50"
              />
              <p className="text-xs text-muted-foreground">
                Maks 5MB. Last opp skjermbilde fra løpeapp eller bilde fra løpet.
              </p>
            </div>

            {imagePreview && (
              <div className="relative aspect-video w-full max-w-md mx-auto overflow-hidden rounded-lg border border-border/50">
                <img
                  src={imagePreview}
                  alt="Forhåndsvisning"
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="comment">Kommentar (valgfritt)</Label>
              <Textarea
                id="comment"
                name="comment"
                placeholder="Fortell om løpet ditt..."
                rows={4}
                maxLength={500}
                disabled={loading}
                className="bg-input/50 resize-none"
              />
              <p className="text-xs text-muted-foreground">Maks 500 tegn</p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base"
            disabled={loading}
          >
            {loading ? 'Sender inn...' : 'Send inn mitt løp'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
