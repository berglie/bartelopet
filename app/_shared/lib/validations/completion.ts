import { z } from 'zod';
import { getCurrentEventYear } from '@/app/_shared/lib/utils/event-year';
import { IMAGE_CONSTRAINTS } from '@/app/_shared/lib/constants/images';

/**
 * Completion validation schemas
 * Matches the database schema for completions table
 */

export const completionCreateSchema = z.object({
  participant_id: z.string().uuid('Ugyldig deltaker-ID').optional(),
  completed_date: z.string().refine(
    (date) => {
      const parsed = new Date(date);
      const now = new Date();
      const currentYear = getCurrentEventYear();

      // Must be a valid date
      if (isNaN(parsed.getTime())) return false;

      // Cannot be in the future
      if (parsed > now) return false;

      // Must be within current event year
      const yearStart = new Date(`${currentYear}-01-01`);
      const yearEnd = new Date(`${currentYear}-12-31`);

      return parsed >= yearStart && parsed <= yearEnd;
    },
    {
      message: 'Dato må være innenfor inneværende år og ikke i fremtiden',
    }
  ),
  duration_text: z
    .string()
    .max(50, 'Varighet kan ikke være lengre enn 50 tegn')
    .trim()
    .optional()
    .nullable(),
  comment: z
    .string()
    .max(500, 'Kommentar kan ikke være lengre enn 500 tegn')
    .trim()
    // Strip HTML tags to prevent XSS
    .transform((str) => (str ? str.replace(/<[^>]*>/g, '') : str))
    .optional()
    .nullable(),
  event_year: z.number().int().min(2024).max(2100).optional(),
});

export const completionUpdateSchema = z.object({
  completed_date: z
    .string()
    .refine(
      (date) => {
        const parsed = new Date(date);
        const now = new Date();
        const currentYear = getCurrentEventYear();

        if (isNaN(parsed.getTime())) return false;
        if (parsed > now) return false;

        const yearStart = new Date(`${currentYear}-01-01`);
        const yearEnd = new Date(`${currentYear}-12-31`);

        return parsed >= yearStart && parsed <= yearEnd;
      },
      {
        message: 'Dato må være innenfor inneværende år og ikke i fremtiden',
      }
    )
    .optional(),
  duration_text: z
    .string()
    .max(50, 'Varighet kan ikke være lengre enn 50 tegn')
    .trim()
    .optional()
    .nullable(),
  comment: z
    .string()
    .max(500, 'Kommentar kan ikke være lengre enn 500 tegn')
    .trim()
    .transform((str) => (str ? str.replace(/<[^>]*>/g, '') : str))
    .optional()
    .nullable(),
});

// Image caption validation
export const imageCaptionSchema = z.object({
  caption: z
    .string()
    .max(
      IMAGE_CONSTRAINTS.MAX_CAPTION_LENGTH,
      `Bildetekst kan ikke være lengre enn ${IMAGE_CONSTRAINTS.MAX_CAPTION_LENGTH} tegn`
    )
    .trim()
    .transform((str) => str.replace(/<[^>]*>/g, '')),
});

// Image reordering validation
export const reorderImagesSchema = z.object({
  completionId: z.string().uuid('Ugyldig fullførings-ID'),
  imageIds: z
    .array(z.string().uuid('Ugyldig bilde-ID'))
    .min(1, 'Minst ett bilde er påkrevd')
    .max(
      IMAGE_CONSTRAINTS.MAX_IMAGES_PER_COMPLETION,
      `Maksimalt ${IMAGE_CONSTRAINTS.MAX_IMAGES_PER_COMPLETION} bilder`
    ),
});

export type CompletionCreateInput = z.infer<typeof completionCreateSchema>;
export type CompletionUpdateInput = z.infer<typeof completionUpdateSchema>;
export type ImageCaptionInput = z.infer<typeof imageCaptionSchema>;
export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;
