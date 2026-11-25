import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously, signOut } from "firebase/auth";
import { isStaleAuthError } from "../utils/authRecovery.js";

const env = import.meta.env ?? {};
const requiredEnvKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];
const missingEnvKeys = requiredEnvKeys.filter((key) => !env[key]);
if (env.PROD && missingEnvKeys.length > 0) {
  throw new Error(`Missing Firebase config: ${missingEnvKeys.join(', ')}`);
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'test-api-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'localhost',
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || 'https://test.firebaseio.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'test-project',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'test.appspot.com',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: env.VITE_FIREBASE_APP_ID || '1:000000000000:web:test',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);

// Auto-sign-in anonymous, resolve when ready
const signInAndVerify = async () => {
  const { user } = await signInAnonymously(auth);
  await user.getIdToken();
  return user;
};

const startAnonymousSession = async () => {
  try {
    return await signInAndVerify();
  } catch (error) {
    if (!isStaleAuthError(error)) {
      console.error(`Anonymous auth failed (${error?.code || error?.message}):`, error);
      return null;
    }

    try {
      await signOut(auth);
      return await signInAndVerify();
    } catch (retryError) {
      console.error(`Anonymous auth retry failed (${retryError?.code || retryError?.message}):`, retryError);
      return null;
    }
  }
};

export const authReady = typeof window === "undefined" ? Promise.resolve(null) : startAnonymousSession();