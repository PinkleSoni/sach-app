import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { useAuthRequest, useAutoDiscovery, makeRedirectUri, ResponseType } from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { loadDemoUser, saveDemoUser } from '../lib/storage';

// A placeholder identity so the sign-in flow can be tried before a real
// Firebase project exists. Clearly marked `isDemo` everywhere it's shown,
// and never reaches Firestore — reviews posted while "signed in" this way
// stay local-only, the same as before sign-in existed at all.
const DEMO_USER = { uid: 'demo-user', displayName: 'Demo User', email: 'demo@sach.app', photoURL: null, isDemo: true };

// Lets the browser-based sign-in sheet close itself and hand control back
// to the app once Google redirects back — required once, at module scope.
WebBrowser.maybeCompleteAuthSession();

// A Google Cloud "Web client ID" (console.cloud.google.com, or auto-created
// by enabling Google sign-in in a Firebase project's Authentication tab).
// Works for Expo Go (via Expo's auth proxy redirect) and standalone builds
// alike — see the README's "Accounts and shared reviews" section.
const GOOGLE_WEB_CLIENT_ID = '221501369312-o1i990hfmivbepjja08224hn1d9najm4.apps.googleusercontent.com';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');

  const configured = isFirebaseConfigured && GOOGLE_WEB_CLIENT_ID !== 'REPLACE_WITH_GOOGLE_WEB_CLIENT_ID';

  useEffect(() => {
    if (!isFirebaseConfigured) {
      loadDemoUser().then((u) => {
        setUser(u);
        setAuthReady(true);
      });
      return undefined;
    }
    const unsub = onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  const discovery = useAutoDiscovery('https://accounts.google.com');
  const redirectUri = useMemo(() => makeRedirectUri({ scheme: 'sach' }), []);
  const nonce = useMemo(() => Crypto.randomUUID(), []);
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: ResponseType.IdToken,
      usePKCE: false,
      extraParams: { nonce },
    },
    discovery
  );

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params?.id_token;
    if (!idToken) {
      setError('Google sign-in did not return a token. Try again.');
      return;
    }
    setSigningIn(true);
    setError('');
    signInWithCredential(getFirebaseAuth(), GoogleAuthProvider.credential(idToken))
      .catch(() => setError('Could not finish signing in. Try again.'))
      .finally(() => setSigningIn(false));
  }, [response]);

  const signIn = useCallback(async () => {
    if (!configured) {
      // No real Firebase project yet — a brief pause so the loading state
      // (the same one the real flow uses) is visible, then the demo user.
      setError('');
      setSigningIn(true);
      await new Promise((r) => setTimeout(r, 700));
      setUser(DEMO_USER);
      saveDemoUser(DEMO_USER);
      setSigningIn(false);
      return;
    }
    setError('');
    try {
      await promptAsync();
    } catch {
      setError('Could not open sign-in. Try again.');
    }
  }, [configured, promptAsync]);

  const signOut = useCallback(() => {
    if (isFirebaseConfigured) {
      firebaseSignOut(getFirebaseAuth()).catch(() => {});
    } else {
      setUser(null);
      saveDemoUser(null);
    }
  }, []);

  const value = useMemo(
    // The real Google flow needs `request` ready before it can prompt; the
    // demo flow doesn't use it at all, so it shouldn't block on it.
    () => ({ user, authReady, configured, signingIn: signingIn || (configured && !request), error, signIn, signOut }),
    [user, authReady, configured, signingIn, request, error, signIn, signOut]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
