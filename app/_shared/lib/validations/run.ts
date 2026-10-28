import { z } from 'zod';
import { MAX_RUN_KM, MIN_RUN_KM, roundedKm } from '@/app/_shared/types/event-2026';

/** Plain http is only accepted for a local Supabase stack in development. */
const LOCAL_HTTP = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value.replace(/<[^>]*>/g, ''))
    .optional()
    .nullable();

export const runInputSchema = z.object({
  run_date: z.iso.date('Velg en gyldig dato'),
  distance_km: z.coerce
    .number('Oppgi distansen i kilometer')
    .max(MAX_RUN_KM, `Distansen kan ikke være over ${MAX_RUN_KM} km`)
    .refine((km) => roundedKm(km) >= MIN_RUN_KM, `Turen må være minst ${MIN_RUN_KM} km`),
  run_confirmed: z.literal(true, {
    error: 'Du må bekrefte at du har gått eller løpt turen selv',
  }),
  // Display only: never feeds tickets or the draw.
  on_barteloypa: z.boolean().optional(),
  title: optionalText(100),
  duration_text: optionalText(50),
  comment: optionalText(500),
  evidence_url: z
    .string()
    .trim()
    .max(2048)
    .url('Lenken må være en gyldig URL')
    .refine(
      (value) => value.startsWith('https://') || LOCAL_HTTP.test(value),
      'Lenken må starte med https://'
    )
    .optional()
    .nullable()
    .or(z.literal('')),
});

export const interestInputSchema = z.object({
  categories: z.array(z.enum(['short', 'medium', 'long'])).min(1, 'Velg minst én distansekategori'),
});

export type RunInput = z.infer<typeof runInputSchema>;
