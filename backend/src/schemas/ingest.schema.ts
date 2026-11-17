import { z } from 'zod';

export const IngestSchema = z.object({
  type: z.enum(['text', 'url'], {
    required_error: "Type is required ('text' or 'url')",
    invalid_type_error: "Type must be either 'text' or 'url'",
  }),
  content: z.string({
    required_error: 'Content is required',
  }).min(1, 'Content cannot be empty'),
  title: z.string().optional(),
}).refine(
  (data) => {
    if (data.type === 'url') {
      try {
        const parsed = new URL(data.content);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }
    return true;
  },
  {
    message: 'Valid HTTP/HTTPS URL is required when type is "url"',
    path: ['content'],
  }
);

export type IngestInput = z.infer<typeof IngestSchema>;
