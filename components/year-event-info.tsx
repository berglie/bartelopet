'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Trophy, MapPin } from 'lucide-react';
import { useSelectedYear, useIsCurrentYear } from '@/contexts/year-context';

interface EventInfoProps {
  year?: number;
  participantCount: number;
  completionCount: number;
  topVoteCount?: number;
}

/**
 * Display event information specific to a year
 */
export function YearEventInfo({
  year,
  participantCount,
  completionCount,
  topVoteCount
}: EventInfoProps) {
  const contextYear = useSelectedYear();
  const isCurrentYear = useIsCurrentYear();
  const displayYear = year ?? contextYear;
  const isCurrent = year ? year === new Date().getFullYear() : isCurrentYear;

  return (
    <Card className={`bg-gradient-to-br ${isCurrent ? 'from-accent/10 via-card to-primary/5' : 'from-muted/30 via-card to-muted/10'} border-accent/20`}>
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-accent" />
            <h2 className="text-3xl font-bold">Barteløpet {displayYear}</h2>
          </div>
          {isCurrent && (
            <Badge className="bg-accent text-accent-foreground">
              Nåværende
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Deltakere"
            value={participantCount}
            color="text-primary"
          />
          <StatCard
            icon={<Trophy className="h-5 w-5" />}
            label="Fullført"
            value={completionCount}
            color="text-accent"
          />
          {topVoteCount !== undefined && (
            <StatCard
              icon={<Trophy className="h-5 w-5" />}
              label="Flest stemmer"
              value={topVoteCount}
              color="text-accent"
            />
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-semibold">Rute: Stavanger sentrum</p>
              <p className="text-sm text-muted-foreground">
                10km gjennom Stavanger - ikoniske steder, asfaltert
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50 border border-border/30">
      <div className={`${color}`}>{icon}</div>
      <div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/**
 * Compact year badge with stats
 */
export function YearBadgeWithStats({
  year,
  completionCount,
  isActive = false
}: {
  year: number;
  completionCount: number;
  isActive?: boolean;
}) {
  return (
    <div
      className={`
        inline-flex items-center gap-3 px-4 py-2 rounded-full
        ${isActive ? 'bg-accent/20 border-accent' : 'bg-muted border-border'}
        border
      `}
    >
      <span className={`font-bold ${isActive ? 'text-accent' : ''}`}>
        {year}
      </span>
      <span className="text-sm text-muted-foreground">
        {completionCount} fullført
      </span>
    </div>
  );
}
