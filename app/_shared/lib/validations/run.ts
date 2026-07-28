import { z } from 'zod';

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
    .positive('Distansen må være større enn 0')
    .max(500, 'Distansen kan ikke være over 500 km'),
  donation_confirmed: z.literal(true, {
    error: 'Du må bekrefte at donasjonen er gjennomført',
  }),
  title: optionalText(100),
  duration_text: optionalText(50),
  comment: optionalText(500),
  evidence_url: z
    .string()
    .trim()
    .max(2048)
    .url('Lenken må være en gyldig URL')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export const interestInputSchema = z.object({
  categories: z.array(z.enum(['short', 'medium', 'long'])).min(1, 'Velg minst én distansekategori'),
});

export type RunInput = z.infer<typeof runInputSchema>;
