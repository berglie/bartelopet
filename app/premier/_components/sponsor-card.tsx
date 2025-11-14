import { Card, CardContent } from '@/app/_shared/components/ui/card';
import { ExternalLink } from 'lucide-react';
import type { SponsorPublic } from '@/app/_shared/types/sponsor';
import Image from 'next/image';

interface SponsorCardProps {
  sponsor: SponsorPublic;
  priority?: boolean;
}

export function SponsorCard({ sponsor, priority = false }: SponsorCardProps) {
  const cardContent = (
    <CardContent className="space-y-3 p-4 text-center md:p-6">
      {/* Logo */}
      {sponsor.logo_url && (
        <div className="relative mb-2 h-12 w-full">
          <Image
            src={sponsor.logo_url}
            alt={`${sponsor.name} logo`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={priority}
            className="object-contain"
          />
        </div>
      )}

      {/* Company Name */}
      <h3 className="text-lg font-semibold text-foreground md:text-xl">{sponsor.name}</h3>

      {/* Description */}
      {sponsor.description && (
        <p className="text-sm text-muted-foreground md:text-base">{sponsor.description}</p>
      )}

      {/* Contribution */}
      {sponsor.contribution && (
        <div className="mt-3 border-t border-border/50 pt-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Bidrag
          </p>
          {sponsor.contribution.includes('\n') ? (
            <ul className="list-inside list-disc space-y-1 text-left text-sm font-medium text-foreground md:text-base">
              {sponsor.contribution.split('\n').map((item, index) => (
                <li key={index}>{item.replace(/^-\s*/, '')}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm font-medium text-foreground md:text-base">
              {sponsor.contribution}
            </p>
          )}
        </div>
      )}

      {/* Website Link */}
      {sponsor.website_url && (
        <div className="flex items-center justify-center gap-2 text-accent transition-colors hover:text-accent/80">
          <span className="text-sm">Besøk nettside</span>
          <ExternalLink className="h-3 w-3" aria-label="External link" />
        </div>
      )}
    </CardContent>
  );

  if (sponsor.website_url) {
    return (
      <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="block">
        <Card className="h-full border-border/50 bg-card/50 backdrop-blur transition-all hover:border-accent/50">
          {cardContent}
        </Card>
      </a>
    );
  }

  return <Card className="h-full border-border/50 bg-card/50 backdrop-blur">{cardContent}</Card>;
}
