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
    <CardContent className="p-4 md:p-6 space-y-3 text-center">
      {/* Logo */}
      {sponsor.logo_url && (
        <div className="relative w-full h-12 mb-2">
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
      <h3 className="text-lg md:text-xl font-semibold text-foreground">
        {sponsor.name}
      </h3>

      {/* Description */}
      {sponsor.description && (
        <p className="text-sm md:text-base text-muted-foreground">
          {sponsor.description}
        </p>
      )}

      {/* Contribution */}
      {sponsor.contribution && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
            Bidrag
          </p>
          {sponsor.contribution.includes('\n') ? (
            <ul className="text-sm md:text-base text-foreground font-medium list-disc list-inside text-left space-y-1">
              {sponsor.contribution.split('\n').map((item, index) => (
                <li key={index}>{item.replace(/^-\s*/, '')}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm md:text-base text-foreground font-medium">
              {sponsor.contribution}
            </p>
          )}
        </div>
      )}

      {/* Website Link */}
      {sponsor.website_url && (
        <div className="flex items-center justify-center gap-2 text-accent hover:text-accent/80 transition-colors">
          <span className="text-sm">Besøk nettside</span>
          <ExternalLink className="h-3 w-3" aria-label="External link" />
        </div>
      )}
    </CardContent>
  );

  if (sponsor.website_url) {
    return (
      <a
        href={sponsor.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Card className="bg-card/50 border-border/50 backdrop-blur hover:border-accent/50 transition-all h-full">
          {cardContent}
        </Card>
      </a>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur h-full">
      {cardContent}
    </Card>
  );
}
