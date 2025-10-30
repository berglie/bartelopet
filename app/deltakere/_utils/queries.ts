/**
 * Server-side queries for participants feature
 */

import { createClient } from '@/app/_shared/lib/supabase/server'

export interface ParticipantListItem {
  full_name: string
  bib_number: number
  has_completed: boolean
  event_year: number
}

export interface ParticipantsStats {
  total: number
  completed: number
}

export async function getParticipants(year: number): Promise<ParticipantListItem[]> {
  const supabase = await createClient()

  const { data: participants, error } = await supabase
    .from('participants')
    .select('full_name, bib_number, has_completed, event_year')
    .eq('event_year', year)
    .order('bib_number', { ascending: true })

  if (error) {
    console.error('Error fetching participants:', error)
    return []
  }

  return participants || []
}

export async function getParticipantsStats(year: number): Promise<ParticipantsStats> {
  const supabase = await createClient()

  const [
    { count: totalCount },
    { count: completedCount }
  ] = await Promise.all([
    supabase.from('participants').select('*', { count: 'exact', head: true }).eq('event_year', year),
    supabase.from('participants').select('*', { count: 'exact', head: true }).eq('event_year', year).eq('has_completed', true)
  ])

  return {
    total: totalCount || 0,
    completed: completedCount || 0
  }
}