import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, isAbsolute, resolve } from 'path';

let isInitialized = false;

export function ensureFirebaseAdmin() {
  if (isInitialized) return { messaging: getMessaging };

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    let serviceAccount = null;

    // 1. Check path defined in environment variables (e.g. FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS)
    const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (envPath) {
      const resolvedPath = isAbsolute(envPath) ? envPath : resolve(process.cwd(), envPath);
      if (existsSync(resolvedPath)) {
        serviceAccount = JSON.parse(readFileSync(resolvedPath, 'utf8'));
      }
    }

    // 2. Fallback to default relative path in same directory
    if (!serviceAccount) {
      const defaultPath = join(__dirname, 'firebase-service-account.json');
      if (existsSync(defaultPath)) {
        serviceAccount = JSON.parse(readFileSync(defaultPath, 'utf8'));
      }
    }

    // 3. Fallback to direct JSON string in environment variable
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      } catch (e) {
        console.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON format');
      }
    }

    if (!serviceAccount) {
      throw new Error('No Firebase service account credentials found. Please set FIREBASE_SERVICE_ACCOUNT_PATH in .env or provide src/config/firebase-service-account.json');
    }

    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
    });

    isInitialized = true;
    console.log('Firebase Admin initialized successfully.');
    return { messaging: getMessaging };
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error.message || error);
    return null;
  }
}

export function getFirebaseAdmin() {
  return isInitialized ? { messaging: getMessaging } : ensureFirebaseAdmin();
}
