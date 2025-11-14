'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/app/_shared/components/ui/card';
import { Input } from '@/app/_shared/components/ui/input';
import { Textarea } from '@/app/_shared/components/ui/textarea';
import { Button } from '@/app/_shared/components/ui/button';
import { Label } from '@/app/_shared/components/ui/label';
import { Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function KontaktPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/kontakt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus({
          type: 'success',
          message: data.message,
        });
        setFormData({ name: '', email: '', message: '' });
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.message || 'En feil oppstod. Vennligst prøv igjen.',
        });
      }
    } catch {
      setSubmitStatus({
        type: 'error',
        message: 'En feil oppstod. Vennligst prøv igjen senere.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const isFormValid =
    formData.name.length >= 2 &&
    formData.email.length > 0 &&
    formData.message.length >= 10 &&
    formData.message.length <= 1000;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />

        <div className="container relative mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2">
              <Mail className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Kontakt oss</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Vi hører gjerne fra deg
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Har du spørsmål, tilbakemeldinger eller trenger hjelp? Send oss en melding, så svarer
              vi så snart vi kan.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            {submitStatus.type === 'success' ? (
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur">
                <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
                <CardContent className="relative space-y-6 p-8 text-center md:p-16">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent/20">
                    <CheckCircle2 className="h-10 w-10 text-accent" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold md:text-4xl">Takk for din henvendelse!</h2>
                    <p className="mx-auto max-w-md text-lg text-muted-foreground">
                      {submitStatus.message}
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/')}
                    size="lg"
                    className="bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90"
                  >
                    Tilbake til forsiden
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader className="space-y-1 pb-8">
                  <CardTitle className="text-2xl">Send oss en melding</CardTitle>
                  <CardDescription>
                    Fyll ut skjemaet under, så tar vi kontakt med deg.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {submitStatus.type === 'error' && (
                      <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                        <p className="text-sm text-destructive">{submitStatus.message}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="name">Navn *</Label>
                      <Input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ditt navn"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-post *</Label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="din@epost.no"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="message">Melding *</Label>
                        <span
                          className={`text-xs ${
                            formData.message.length < 10
                              ? 'text-muted-foreground'
                              : formData.message.length > 1000
                                ? 'font-medium text-destructive'
                                : formData.message.length > 900
                                  ? 'font-medium text-yellow-500'
                                  : 'text-accent'
                          }`}
                        >
                          {formData.message.length}/1000 tegn
                        </span>
                      </div>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Skriv din melding her..."
                        className="resize-none"
                        maxLength={1000}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !isFormValid}
                      size="lg"
                      className="w-full bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Sender...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Send melding
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
