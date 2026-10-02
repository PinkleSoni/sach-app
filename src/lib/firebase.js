// Firebase: Auth (Google sign-in) + Firestore (shared reviews). Config
// values below are NOT secret — Firebase's web config is meant to be
// public in client apps; what actually protects data is the Firestore
// Security Rules (see firestore.rules) and Google's own OAuth consent
// screen, not hiding these values.
import { Platform } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDxvr7b81plUk_muZctdvR_SPf08D8RrWM',
  authDomain: 'sach-7d177.firebaseapp.com',
  projectId: 'sach-7d177',
  storageBucket: 'sach-7d177.firebasestorage.app',
  messagingSenderId: '221501369312',
  appId: '1:221501369312:web:4efc001d22d92fc68a9985',
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'REPLACE_WITH_FIREBASE_API_KEY';

// initializeApp/initializeAuth throw if called twice (e.g. on Fast Refresh
// during development), so guard against re-running them.
const app = getApps()[0] || initializeApp(firebaseConfig);

// getReactNativePersistence only exists in Firebase's native build, so web
// uses the default (browser) persistence. On native, initializeAuth throws
// if Fast Refresh runs it twice, so fall back to the existing instance.
let authInstance = null;
export function getFirebaseAuth() {
  if (!authInstance) {
    if (Platform.OS === 'web') {
      authInstance = getAuth(app);
    } else {
      try {
        authInstance = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
      } catch {
        authInstance = getAuth(app);
      }
    }
  }
  return authInstance;
}

export const db = getFirestore(app);
