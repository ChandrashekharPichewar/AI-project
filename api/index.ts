import { createApp } from '../backend/src/app.js';
import { checkDatabaseConnection } from '../backend/src/config/prisma.js';

const app = createApp();

let isDbChecked = false;

export default async function handler(req: any, res: any) {
  if (!isDbChecked) {
    await checkDatabaseConnection().catch((err) => {
      console.error('Vercel serverless DB check warning:', err);
    });
    isDbChecked = true;
  }
  return app(req, res);
}
