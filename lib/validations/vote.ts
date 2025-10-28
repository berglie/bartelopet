import { z } from 'zod';

/**
 * Vote validation schemas
 */

export const voteCreateSchema = z.object({
  completion_id: z.string().uuid('Ugyldig completion ID'),
});

export type VoteCreateInput = z.infer<typeof voteCreateSchema>;
