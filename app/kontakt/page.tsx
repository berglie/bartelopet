'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_shared/components/ui/card';
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

        <div className="container mx-auto px-4 py-16 md:py-20 relative">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 px-4 py-2 rounded-full">
              <Mail className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Kontakt oss</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Vi hører gjerne fra deg
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Har du spørsmål, tilbakemeldinger eller trenger hjelp? Send oss en melding,
              så svarer vi så snart vi kan.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {submitStatus.type === 'success' ? (
              <Card className="bg-card/50 border-border/50 backdrop-blur relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
                <CardContent className="p-8 md:p-16 text-center space-y-6 relative">
                  <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-accent" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl md:text-4xl font-bold">
                      Takk for din henvendelse!
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                      {submitStatus.message}
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/')}
                    size="lg"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20"
                  >
                    Tilbake til forsiden
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/50 border-border/50 backdrop-blur">
                <CardHeader className="space-y-1 pb-8">
                  <CardTitle className="text-2xl">Send oss en melding</CardTitle>
                  <CardDescription>
                    Fyll ut skjemaet under, så tar vi kontakt med deg.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {submitStatus.type === 'error' && (
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{submitStatus.message}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Navn *
                      </Label>
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
                      <Label htmlFor="email">
                        E-post *
                      </Label>
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
                        <Label htmlFor="message">
                          Melding *
                        </Label>
                        <span className={`text-xs ${
                          formData.message.length < 10
                            ? 'text-muted-foreground'
                            : formData.message.length > 1000
                              ? 'text-destructive font-medium'
                              : formData.message.length > 900
                                ? 'text-yellow-500 font-medium'
                                : 'text-accent'
                        }`}>
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
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
