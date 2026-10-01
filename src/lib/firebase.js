// Firebase: Auth (Google sign-in) + Firestore (shared reviews). Config
// values below are NOT secret — Firebase's web config is meant to be
// public in client apps; what actually protects data is the Firestore
// Security Rules (see firestore.rules) and Google's own OAuth consent
// screen, not hiding these values.
//
// TODO before this works: paste in the real values from a Firebase
// project — console.firebase.google.com → Project settings → your app's
// config. See README's "Accounts and shared reviews" section for the
// exact steps.
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'REPLACE_WITH_FIREBASE_API_KEY',
  authDomain: 'REPLACE_WITH_PROJECT_ID.firebaseapp.com',
  projectId: 'REPLACE_WITH_PROJECT_ID',
  storageBucket: 'REPLACE_WITH_PROJECT_ID.appspot.com',
  messagingSenderId: 'REPLACE_WITH_SENDER_ID',
  appId: 'REPLACE_WITH_APP_ID',
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'REPLACE_WITH_FIREBASE_API_KEY';

// initializeApp/initializeAuth throw if called twice (e.g. on Fast Refresh
// during development), so guard against re-running them.
const app = getApps()[0] || initializeApp(firebaseConfig);

let authInstance = null;
export function getFirebaseAuth() {
  if (!authInstance) {
    authInstance = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  }
  return authInstance;
}

export const db = getFirestore(app);
