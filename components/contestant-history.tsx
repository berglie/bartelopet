'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface YearCompletionData {
  year: number;
  completed: boolean;
  completionId?: string;
  voteCount: number;
  completedDate?: string;
  photoUrl?: string;
}

interface ContestantHistoryProps {
  history: YearCompletionData[];
  participantName: string;
}

/**
 * Display a contestant's participation history across years
 */
export function ContestantHistory({ history, participantName }: ContestantHistoryProps) {
  const totalCompletions = history.filter(h => h.completed).length;
  const totalVotes = history.reduce((sum, h) => sum + h.voteCount, 0);
  const bestYear = history.reduce((best, current) =>
    current.voteCount > best.voteCount ? current : best,
    history[0]
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Totalt antall fullførte løp</CardDescription>
            <CardTitle className="text-4xl text-accent">{totalCompletions}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Totalt antall stemmer</CardDescription>
            <CardTitle className="text-4xl text-primary">{totalVotes}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Beste år</CardDescription>
            <CardTitle className="text-4xl">{bestYear?.year}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {bestYear?.voteCount} stemmer
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* Year-by-Year History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historikk
          </CardTitle>
          <CardDescription>
            {participantName} sin deltakelse i Barteløpet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.map((yearData) => (
              <YearHistoryItem key={yearData.year} data={yearData} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Individual year history item
 */
function YearHistoryItem({ data }: { data: YearCompletionData }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-accent/50 transition-colors">
      <div className="flex-shrink-0 w-20 text-center">
        <div className="text-2xl font-bold">{data.year}</div>
        {data.completed && (
          <Badge variant="outline" className="mt-1 text-xs">
            Fullført
          </Badge>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {data.completed ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" />
              <span className="font-medium">Løp fullført</span>
            </div>
            {data.completedDate && (
              <p className="text-sm text-muted-foreground">
                Dato: {new Date(data.completedDate).toLocaleDateString('nb-NO')}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>{data.voteCount} stemmer</span>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Ingen registrert deltakelse</p>
        )}
      </div>

      {data.completed && data.completionId && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/galleri?year=${data.year}#${data.completionId}`}>
            Se bilde
          </Link>
        </Button>
      )}
    </div>
  );
}

/**
 * Aggregate stats component
 */
export function AggregateStats({ history }: { history: YearCompletionData[] }) {
  const completions = history.filter(h => h.completed);
  const participationRate = completions.length / history.length;
  const averageVotes = completions.length > 0
    ? completions.reduce((sum, h) => sum + h.voteCount, 0) / completions.length
    : 0;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="bg-card/50 border-accent/20">
        <CardContent className="p-6 text-center">
          <div className="text-4xl font-bold text-accent mb-2">
            {completions.length}
          </div>
          <p className="text-sm text-muted-foreground">År fullført</p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-accent/20">
        <CardContent className="p-6 text-center">
          <div className="text-4xl font-bold text-accent mb-2">
            {Math.round(participationRate * 100)}%
          </div>
          <p className="text-sm text-muted-foreground">Deltakelsesrate</p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-accent/20">
        <CardContent className="p-6 text-center">
          <div className="text-4xl font-bold text-accent mb-2">
            {averageVotes.toFixed(1)}
          </div>
          <p className="text-sm text-muted-foreground">Gjennomsnittlig stemmer</p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Year comparison component
 */
export function YearComparison({ years }: { years: YearCompletionData[] }) {
  const sortedByVotes = [...years]
    .filter(y => y.completed)
    .sort((a, b) => b.voteCount - a.voteCount);

  if (sortedByVotes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Beste prestasjoner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedByVotes.slice(0, 3).map((yearData, index) => (
            <div
              key={yearData.year}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-sm font-bold">#{index + 1}</span>
                </div>
                <div>
                  <p className="font-semibold">{yearData.year}</p>
                  {yearData.completedDate && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(yearData.completedDate).toLocaleDateString('nb-NO')}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-accent">{yearData.voteCount}</p>
                <p className="text-xs text-muted-foreground">stemmer</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
