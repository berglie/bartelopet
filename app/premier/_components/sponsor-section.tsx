import { SponsorCard } from './sponsor-card';
import type { SponsorPublic } from '@/app/_shared/types/sponsor';

interface SponsorSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  sponsors: SponsorPublic[];
  note?: string;
}

export function SponsorSection({
  title,
  description,
  icon,
  sponsors,
  note,
}: SponsorSectionProps) {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-3 lg:min-h-36 text-center lg:text-left">
        <div className="flex items-center gap-3 justify-center lg:justify-start">
          <div className="flex-shrink-0 text-accent">{icon}</div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </h2>
        </div>
        <p className="text-sm md:text-base text-muted-foreground">
          {description}
        </p>
        {note && (
          <p className="text-sm italic text-accent/80 bg-accent/10 border border-accent/30 px-3 py-2 rounded-md">
            {note}
          </p>
        )}
      </div>

      {/* Sponsor Cards */}
      <div className="space-y-4">
        {sponsors.length > 0 ? (
          sponsors.map((sponsor) => (
            <SponsorCard key={sponsor.id} sponsor={sponsor} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Ingen bidrag i denne kategorien ennå.
          </p>
        )}
      </div>
    </div>
  );
}
