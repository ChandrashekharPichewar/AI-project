import pino from 'pino';
import { env } from './env.js';

const isServerless =
  !!process.env.VERCEL ||
  process.env.NODE_ENV === 'production' ||
  process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

export const logger = pino({
  level: env.LOG_LEVEL || 'info',
  transport:
    !isServerless && env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
