import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { loadDemoUser, saveDemoUser } from '../lib/storage';

// A placeholder identity for platforms where real sign-in isn't available
// yet. Clearly marked `isDemo` everywhere it's shown, and never reaches
// Firestore — reviews posted while "signed in" this way stay local-only.
const DEMO_USER = { uid: 'demo-user', displayName: 'Demo User', email: 'demo@sach.app', photoURL: null, isDemo: true };

// Real Google sign-in is web-only for now. On phones, Google rejects the
// exp:// / custom-scheme redirects a web OAuth client would need, and Expo's
// auth proxy is gone in SDK 57, so native sign-in needs Google's native
// SDK in a development build — until then phones use the demo user.
const REAL_AUTH = isFirebaseConfigured && Platform.OS === 'web';

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
      } else {
        await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      }
    } catch (e) {
      const dismissed = e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request';
      if (!dismissed) setError(e?.code === 'auth/popup-blocked' ? 'Your browser blocked the sign-in window. Allow pop-ups and try again.' : 'Could not sign in. Try again.');
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(() => {
    if (REAL_AUTH) {
      firebaseSignOut(getFirebaseAuth()).catch(() => {});
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
