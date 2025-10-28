import { z } from 'zod';

/**
 * Completion validation schemas
 */

export const completionCreateSchema = z.object({
  distance_km: z.number().min(0.1, 'Distanse må være minst 0.1 km').max(100, 'Distanse kan ikke være mer enn 100 km'),
  duration_minutes: z.number().min(1, 'Varighet må være minst 1 minutt').max(1000, 'Varighet kan ikke være mer enn 1000 minutter').optional(),
  location: z.string().max(200, 'Lokasjon kan ikke være lengre enn 200 tegn').optional(),
  notes: z.string().max(1000, 'Notater kan ikke være lengre enn 1000 tegn').optional(),
  completed_at: z.string().datetime('Ugyldig dato'),
});

export const completionUpdateSchema = z.object({
  distance_km: z.number().min(0.1).max(100).optional(),
  duration_minutes: z.number().min(1).max(1000).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  is_featured: z.boolean().optional(),
});

export type CompletionCreateInput = z.infer<typeof completionCreateSchema>;
export type CompletionUpdateInput = z.infer<typeof completionUpdateSchema>;
