import dotenv from 'dotenv';
dotenv.config();
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

try {
  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
    console.log('[Firebase] Admin SDK initialized successfully via inline environment variables.');
  } else if (serviceAccountPath) {
    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);

    if (fs.existsSync(absolutePath)) {
      const serviceAccount = require(absolutePath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log(`[Firebase] Admin SDK initialized successfully using credentials file: ${serviceAccountPath}`);
    } else {
      console.warn(`[Firebase Warning] Credentials file not found at: ${absolutePath}. Admin operations might fail.`);
    }
  } else {
    console.warn('[Firebase Warning] Firebase environment variables not fully configured. API verification will fail until configured.');
  }
} catch (error: any) {
  console.error('[Firebase Error] Failed to initialize Firebase Admin SDK:', error.message);
}

export default admin;
