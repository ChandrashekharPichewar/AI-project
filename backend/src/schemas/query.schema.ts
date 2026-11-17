import { z } from 'zod';

export const QuerySchema = z.object({
  query: z.string({
    required_error: 'Query is required',
  }).min(2, 'Query must be at least 2 characters long'),
  topK: z.number().int().min(1).max(20).optional().default(4),
});

export type QueryInput = z.infer<typeof QuerySchema>;
