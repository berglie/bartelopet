import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Ugyldig e-postadresse').toLowerCase(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
