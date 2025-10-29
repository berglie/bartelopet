import { SubmissionForm } from '@/components/submission-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EditRestrictionGuard, ReadOnlyBanner } from '@/components/edit-restriction-guard';
import { getCurrentEventYear } from '@/lib/utils/year';

export default function SubmitPage() {
  const currentYear = getCurrentEventYear();

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Send inn ditt løp</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Har du fullført 10km? Registrer deg og last opp detaljer fra løpet ditt
          </p>
        </div>

        {/* Read-only banner */}
        <ReadOnlyBanner year={currentYear} />

        <EditRestrictionGuard year={currentYear}>
          {/* Info Card */}
          <Card className="bg-card/50 border-accent/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-accent">Før du sender inn</CardTitle>
              <CardDescription>Sjekk at du har følgende klart:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-accent text-xs">✓</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Bilde fra løpet:</strong> Skjermbilde fra løpeapp eller foto fra ruten (maks 5MB)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-accent text-xs">✓</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Postadresse:</strong> For utsending av medalje
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-accent text-xs">✓</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Dato og tid:</strong> Når du gjennomførte løpet (valgfritt)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submission Form */}
          <SubmissionForm />
        </EditRestrictionGuard>
      </div>
    </div>
  );
}
