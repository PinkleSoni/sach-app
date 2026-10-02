import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PROFILE_GROUPS } from '../lib/match';
import { Btn, Chip, Eyebrow } from '../components/ui';
import Icon from '../components/Icon';
import { colors, fonts } from '../theme';

const PRIVACY_URL = 'https://pinklesoni.github.io/sach-app/privacy.html';
const TERMS_URL = 'https://pinklesoni.github.io/sach-app/terms.html';

// The "My fit" tab: edit what Sach checks every product against.
export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, setProfile } = useApp();
  const { user, signIn, signOut, signingIn, configured, error: authError } = useAuth();
  const [sel, setSel] = useState(profile || {});
  const [saved, setSaved] = useState(false);

  // Pick up changes made elsewhere (for example after onboarding).
  useEffect(() => { setSel(profile || {}); }, [profile]);

  const save = () => {
    setProfile(sel);
    setSaved(true);
    navigation.navigate('Home');
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 12 }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.head}>
          <Eyebrow>Your fit</Eyebrow>
          <Text style={s.title} accessibilityRole="header">Set your fit once. We check every product against it.</Text>
        </View>

        <View style={s.account}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {user ? (
              <>
                <View style={[s.avatar, user.isDemo && s.avatarDemo]}><Text style={[s.avatarText, user.isDemo && s.avatarTextDemo]}>{(user.displayName || user.email || '?')[0].toUpperCase()}</Text></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.accountName} numberOfLines={1}>{user.displayName || 'Signed in'}</Text>
                  <Text style={s.accountSub} numberOfLines={1}>{user.isDemo ? 'Placeholder account — reviews stay on this phone' : user.email}</Text>
                </View>
                <Btn label="Sign out" onPress={signOut} style={s.signOut}><Text style={s.signOutText}>Sign out</Text></Btn>
              </>
            ) : (
              <>
                <View style={s.avatar}><Icon name="user" size={20} color={colors.paper} /></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.accountName}>{configured ? 'Sign in to share reviews' : 'Try the sign-in flow'}</Text>
                  <Text style={s.accountSub}>
                    {configured
                      ? 'So people checking this product can see what you wrote, and you can see theirs'
                      : 'Real Google sign-in isn’t connected yet — this is a placeholder so you can preview it'}
                  </Text>
                </View>
                <Btn label={configured ? 'Sign in with Google' : 'Try demo sign-in'} onPress={signIn} disabled={signingIn} style={[s.signIn, signingIn && { opacity: 0.6 }]}>
                  <Text style={s.signInText}>{signingIn ? '…' : configured ? 'Sign in' : 'Try it'}</Text>
                </Btn>
              </>
            )}
          </View>
          {!user && (
            <Text style={s.consent}>
              By continuing, you agree to Sach's{' '}
              <Text style={s.consentLink} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy Policy</Text>
              {' '}and{' '}
              <Text style={s.consentLink} onPress={() => Linking.openURL(TERMS_URL)}>Terms of Service</Text>.
            </Text>
          )}
        </View>
        {!!authError && <Text style={s.authError}>{authError}</Text>}

        {PROFILE_GROUPS.map((g) => (
          <View key={g.title} style={s.group}>
            <Text style={s.legend}>{g.title}</Text>
            <View style={s.chips}>
              {g.items.map((label) => (
                <Chip key={label} label={label} on={!!sel[label]} onPress={() => { setSaved(false); setSel((p) => ({ ...p, [label]: !p[label] })); }} />
              ))}
            </View>
          </View>
        ))}
        <Text style={s.note}>Your fit stays on this phone.</Text>
        <Text style={s.disclaimer}>These filters are a guide to help you find products that fit your skin or hair, not a guarantee — always check the label, and see a dermatologist or trichologist for a real diagnosis.</Text>
        <Btn label="Replay the welcome tour" onPress={() => navigation.getParent()?.navigate('Welcome')} style={s.replay}>
          <Text style={s.replayText}>Replay the welcome tour</Text>
        </Btn>
      </ScrollView>
      <View style={s.footer}>
        <Btn onPress={save} label="Save my fit" style={s.cta}>
          <Text style={s.ctaText}>{saved ? 'Saved' : 'Save my fit'}</Text>
        </Btn>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  head: { gap: 8, paddingBottom: 8 },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.4, color: colors.forest },
  account: { marginTop: 18, gap: 10, padding: 14, borderRadius: 18, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  consent: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.muted },
  consentLink: { fontFamily: fonts.semibold, color: colors.green },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  avatarDemo: { backgroundColor: colors.amber },
  avatarText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
  avatarTextDemo: { color: colors.forest },
  accountName: { fontFamily: fonts.bold, fontSize: 14, color: colors.forest },
  accountSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  signOut: { minHeight: 36, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: colors.sandDark, justifyContent: 'center' },
  signOutText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.forest },
  signIn: { minHeight: 36, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.green, justifyContent: 'center' },
  signInText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.paper },
  authError: { marginTop: 8, fontFamily: fonts.regular, fontSize: 12, color: colors.coralInk },
  group: { marginTop: 20, gap: 10 },
  legend: { fontFamily: fonts.bold, fontSize: 15, color: colors.forest },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  note: { marginTop: 24, fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  disclaimer: { marginTop: 8, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.muted },
  replay: { minHeight: 44, justifyContent: 'center' },
  replayText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.green },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: colors.cream },
  cta: { minHeight: 56, borderRadius: 16, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: fonts.bold, fontSize: 17, color: colors.paper },
});
