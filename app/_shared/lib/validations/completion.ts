import { z } from 'zod';

/**
 * Completion validation schemas
 * Matches the database schema for completions table
 */

export const completionCreateSchema = z.object({
  participant_id: z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Ugyldig deltaker-ID'
  ),
  completed_date: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Ugyldig dato'),
  duration_text: z.string().max(50, 'Varighet kan ikke være lengre enn 50 tegn').optional().nullable(),
  comment: z.string().max(500, 'Kommentar kan ikke være lengre enn 500 tegn').optional().nullable(),
  event_year: z.number().int().min(2024).max(2100).optional(),
});

export const completionUpdateSchema = z.object({
  completed_date: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Ugyldig dato').optional(),
  duration_text: z.string().max(50).optional().nullable(),
  comment: z.string().max(500).optional().nullable(),
});

export type CompletionCreateInput = z.infer<typeof completionCreateSchema>;
export type CompletionUpdateInput = z.infer<typeof completionUpdateSchema>;
