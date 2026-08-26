import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

let isInitialized = false;

export function ensureFirebaseAdmin() {
  if (isInitialized) return { messaging: getMessaging };

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const serviceAccountPath = join(__dirname, 'firebase-service-account.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    initializeApp({
      credential: cert(serviceAccount),
    });
    
    isInitialized = true;
    console.log('Firebase Admin initialized successfully using JSON file.');
    return { messaging: getMessaging };
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    return null;
  }
}

export function getFirebaseAdmin() {
  return isInitialized ? { messaging: getMessaging } : ensureFirebaseAdmin();
}
