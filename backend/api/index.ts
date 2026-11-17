import { createApp } from '../src/app.js';
import { checkDatabaseConnection } from '../src/config/prisma.js';

const app = createApp();

// Initialize DB connection check (cached across warm lambda invocations)
checkDatabaseConnection().catch((err) => {
  console.error('Vercel serverless DB check error:', err);
});

export default app;
