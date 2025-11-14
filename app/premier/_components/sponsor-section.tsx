import { SponsorCard } from './sponsor-card';
import type { SponsorPublic } from '@/app/_shared/types/sponsor';

interface SponsorSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  sponsors: SponsorPublic[];
  note?: string;
}

export function SponsorSection({ title, description, icon, sponsors, note }: SponsorSectionProps) {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-3 text-center lg:min-h-36 lg:text-left">
        <div className="flex items-center justify-center gap-3 lg:justify-start">
          <div className="flex-shrink-0 text-accent">{icon}</div>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h2>
        </div>
        <p className="text-sm text-muted-foreground md:text-base">{description}</p>
        {note && (
          <p className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm italic text-accent/80">
            {note}
          </p>
        )}
      </div>

      {/* Sponsor Cards */}
      <div className="space-y-4">
        {sponsors.length > 0 ? (
          sponsors.map((sponsor) => <SponsorCard key={sponsor.id} sponsor={sponsor} />)
        ) : (
          <p className="text-sm italic text-muted-foreground">
            Ingen bidrag i denne kategorien ennå.
          </p>
        )}
      </div>
    </div>
  );
}
