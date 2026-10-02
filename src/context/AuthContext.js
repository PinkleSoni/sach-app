import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { loadDemoUser, saveDemoUser } from '../lib/storage';

// A placeholder identity for platforms where real sign-in isn't available
// yet. Clearly marked `isDemo` everywhere it's shown, and never reaches
// Firestore — reviews posted while "signed in" this way stay local-only.
const DEMO_USER = { uid: 'demo-user', displayName: 'Demo User', email: 'demo@sach.app', photoURL: null, isDemo: true };

// The Web client ID from the Firebase project's Google sign-in provider; the
// native SDK uses it to get an ID token Firebase will accept.
const GOOGLE_WEB_CLIENT_ID = '221501369312-o1i990hfmivbepjja08224hn1d9najm4.apps.googleusercontent.com';

// Phones use Google's native sign-in, which only exists in an installed
// build of the app: Expo Go doesn't include the native module (and Google
// rejects the exp:// redirect a web client would need), so requiring it
// throws there and Expo Go keeps the labelled demo user.
let Native = null;
if (Platform.OS !== 'web') {
  try {
    Native = require('@react-native-google-signin/google-signin');
    Native.GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  } catch {
    Native = null;
  }
}

const REAL_AUTH = isFirebaseConfigured && (Platform.OS === 'web' || !!Native);

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!REAL_AUTH) {
      loadDemoUser().then((u) => {
        setUser(u);
        setAuthReady(true);
      });
      return undefined;
    }
    return onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  const signIn = useCallback(async () => {
    setError('');
    setSigningIn(true);
    try {
      if (!REAL_AUTH) {
        // A brief pause so the loading state is visible, then the demo user.
        await new Promise((r) => setTimeout(r, 700));
        setUser(DEMO_USER);
        saveDemoUser(DEMO_USER);
      } else if (Platform.OS === 'web') {
        await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      } else {
        await Native.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const res = await Native.GoogleSignin.signIn();
        const idToken = Native.isSuccessResponse(res) ? res.data.idToken : null;
        if (idToken) await signInWithCredential(getFirebaseAuth(), GoogleAuthProvider.credential(idToken));
      }
    } catch (e) {
      const dismissed =
        e?.code === 'auth/popup-closed-by-user' ||
        e?.code === 'auth/cancelled-popup-request' ||
        (Native && (e?.code === Native.statusCodes.SIGN_IN_CANCELLED || e?.code === Native.statusCodes.IN_PROGRESS));
      if (!dismissed) setError(e?.code === 'auth/popup-blocked' ? 'Your browser blocked the sign-in window. Allow pop-ups and try again.' : 'Could not sign in. Try again.');
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(() => {
    if (REAL_AUTH) {
      firebaseSignOut(getFirebaseAuth()).catch(() => {});
      // Also drop Google's own session so the next sign-in asks which account.
      if (Native) Native.GoogleSignin.signOut().catch(() => {});
    } else {
      setUser(null);
      saveDemoUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, authReady, configured: REAL_AUTH, signingIn, error, signIn, signOut }),
    [user, authReady, signingIn, error, signIn, signOut]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
