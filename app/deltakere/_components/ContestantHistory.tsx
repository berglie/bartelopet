'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_shared/components/ui/card'
import { Badge } from '@/app/_shared/components/ui/badge'
import { Button } from '@/app/_shared/components/ui/button'
import { Calendar, Trophy, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface YearCompletionData {
  year: number
  completed: boolean
  completionId?: string
  voteCount: number
  completedDate?: string
  photoUrl?: string
}

interface ContestantHistoryProps {
  history: YearCompletionData[]
  participantName: string
}

/**
 * Display a contestant's participation history across years
 */
export function ContestantHistory({ history, participantName }: ContestantHistoryProps) {
  const totalCompletions = history.filter(h => h.completed).length
  const totalVotes = history.reduce((sum, h) => sum + h.voteCount, 0)
  const bestYear = history.reduce((best, current) =>
    current.voteCount > best.voteCount ? current : best,
    history[0]
  )

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

        {bestYear && bestYear.voteCount > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Beste år</CardDescription>
              <CardTitle className="text-4xl">
                {bestYear.year}
                <span className="text-sm text-muted-foreground ml-2">
                  ({bestYear.voteCount} stemmer)
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Deltakelseshistorikk
          </CardTitle>
          <CardDescription>
            Oversikt over {participantName}s deltakelse år for år
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.map((yearData) => (
              <div
                key={yearData.year}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{yearData.year}</p>
                    <Calendar className="h-4 w-4 mx-auto text-muted-foreground" />
                  </div>

                  <div className="flex flex-col gap-2">
                    {yearData.completed ? (
                      <>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 w-fit">
                          Fullført
                        </Badge>
                        {yearData.completedDate && (
                          <span className="text-sm text-muted-foreground">
                            {new Date(yearData.completedDate).toLocaleDateString('nb-NO')}
                          </span>
                        )}
                      </>
                    ) : (
                      <Badge variant="outline" className="w-fit">
                        Påmeldt
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {yearData.voteCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium">{yearData.voteCount} stemmer</span>
                    </div>
                  )}

                  {yearData.completed && yearData.completionId && (
                    <Link href={`/galleri?year=${yearData.year}#${yearData.completionId}`}>
                      <Button variant="outline" size="sm">
                        Se bilde
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}