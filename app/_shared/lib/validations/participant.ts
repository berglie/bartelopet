import { z } from 'zod';

/**
 * Participant validation schemas
 */

export const participantCreateSchema = z.object({
  email: z.string().email('Ugyldig e-postadresse'),
  full_name: z
    .string()
    .min(2, 'Navn må være minst 2 tegn')
    .max(100, 'Navn kan ikke være lengre enn 100 tegn'),
  display_name: z.string().max(50, 'Visningsnavn kan ikke være lengre enn 50 tegn').optional(),
  target_distance_km: z
    .number()
    .min(1, 'Målsatt distanse må være minst 1 km')
    .max(1000, 'Målsatt distanse kan ikke være mer enn 1000 km'),
});

export const participantUpdateSchema = z.object({
  display_name: z.string().max(50, 'Visningsnavn kan ikke være lengre enn 50 tegn').optional(),
  avatar_url: z.string().url('Ugyldig URL').optional(),
  bio: z.string().max(500, 'Bio kan ikke være lengre enn 500 tegn').optional(),
  target_distance_km: z
    .number()
    .min(1, 'Målsatt distanse må være minst 1 km')
    .max(1000, 'Målsatt distanse kan ikke være mer enn 1000 km')
    .optional(),
});

export type ParticipantCreateInput = z.infer<typeof participantCreateSchema>;
export type ParticipantUpdateInput = z.infer<typeof participantUpdateSchema>;
