import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Handle Vercel / Serverless SQLite writable path
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  try {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      // Find source dev.db if exists in project
      const possibleSources = [
        path.join(process.cwd(), 'server', 'prisma', 'dev.db'),
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db')
      ];
      
      let copied = false;
      for (const src of possibleSources) {
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, tmpDbPath);
          copied = true;
          break;
        }
      }

      if (!copied) {
        // Create empty file
        fs.writeFileSync(tmpDbPath, '');
      }
    }
    
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
      process.env.DATABASE_URL = 'file:/tmp/dev.db';
    }
  } catch (err) {
    console.warn('Vercel SQLite init warning:', err.message);
  }
}

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  prisma = global.__prisma;
}

export default prisma;
