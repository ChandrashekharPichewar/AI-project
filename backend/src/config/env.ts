import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z
    .union([z.string(), z.number()])
    .default('5000')
    .transform((val) => Number(val)),
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().optional().default(''),
  // Gemini Configuration (Free tier default)
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_EMBEDDING_MODEL: z.string().default('text-embedding-004'),
  GEMINI_CHAT_MODEL: z.string().default('gemini-1.5-flash'),
  // OpenAI Configuration (Optional backup)
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  OPENAI_CHAT_MODEL: z.string().default('gpt-4o-mini'),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.string().default('info'),
});

const parsed = envSchema.safeParse(process.env);

const defaultEnv = {
  PORT: 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
  GEMINI_CHAT_MODEL: process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

if (!parsed.success) {
  console.warn('⚠️ Environment variable notice (using safe defaults):', parsed.error.format());
}

export const env = parsed.success ? parsed.data : defaultEnv;
