import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { PROFILE_GROUPS } from '../lib/match';
import { Btn, Chip, Eyebrow } from '../components/ui';
import { colors, fonts } from '../theme';

// The "My fit" tab: edit what Sach checks every product against.
export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, setProfile } = useApp();
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
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34, color: colors.forest },
  group: { marginTop: 20, gap: 10 },
  legend: { fontFamily: fonts.bold, fontSize: 15, color: colors.forest },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  note: { marginTop: 24, fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  replay: { minHeight: 44, justifyContent: 'center' },
  replayText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.green },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: colors.cream },
  cta: { minHeight: 56, borderRadius: 16, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: fonts.bold, fontSize: 17, color: colors.paper },
});
