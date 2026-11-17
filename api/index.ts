import { createApp } from '../backend/src/app.js';
import { checkDatabaseConnection } from '../backend/src/config/prisma.js';

let appInstance: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!appInstance) {
      appInstance = createApp();
      checkDatabaseConnection().catch((err) => {
        console.warn('Database connection check on cold start:', err);
      });
    }
    return appInstance(req, res);
  } catch (err: any) {
    console.error('Critical serverless function error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: {
          message: err.message || 'Serverless function execution failed',
          stack: err.stack,
        },
      })
    );
  }
}
