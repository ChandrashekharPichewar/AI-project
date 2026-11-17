import { createApp } from '../backend/src/app.js';
import { checkDatabaseConnection } from '../backend/src/config/prisma.js';

const app = createApp();

checkDatabaseConnection().catch((err) => {
  console.error('Vercel serverless DB check error:', err);
});

export default app;
