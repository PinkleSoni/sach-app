import React, { useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { PROFILE_GROUPS } from '../lib/match';
import { Btn, Chip } from '../components/ui';
import Icon from '../components/Icon';
import { StepDots } from './WelcomeScreen';
import { colors, fonts } from '../theme';

// Onboarding asks about ingredients and skin. Hair lives on the My fit tab.
const GROUPS = PROFILE_GROUPS.filter((g) => g.title !== 'Your hair');

export default function FitSetupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { setProfile } = useApp();
  const [sel, setSel] = useState({});
  const count = Object.values(sel).filter(Boolean).length;

  const finish = (profile) => {
    setProfile(profile);
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <View style={s.top}>
        <Btn label="Back" onPress={() => navigation.goBack()} style={s.back}><Icon name="back" color={colors.forest} strokeWidth={2.2} /></Btn>
        <Btn label="Skip" onPress={() => finish({})} style={s.skip}><Text style={s.skipText}>Skip</Text></Btn>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 10 }}>
          <Text style={s.h1} accessibilityRole="header">What should we watch for?</Text>
          <Text style={s.p}>Pick what matters. Every scan checks against this, and you can change it anytime.</Text>
        </View>
        {GROUPS.map((g) => (
          <View key={g.title} style={{ gap: 10 }}>
            <Text style={s.legend}>{g.title}</Text>
            <View style={s.chips}>
              {g.items.map((label) => (
                <Chip key={label} label={label} on={!!sel[label]} onPress={() => setSel((p) => ({ ...p, [label]: !p[label] }))} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <StepDots step={2} />
        <Btn label={count ? `Start checking, ${count} selected` : 'Start checking'} onPress={() => finish(sel)} style={s.cta}>
          <Text style={s.ctaText}>{count ? `Start checking (${count})` : 'Start checking'}</Text>
          <Icon name="arrow" size={20} color={colors.paper} strokeWidth={2.2} />
        </Btn>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  skip: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  skipText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.mutedDark },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 22 },
  h1: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 35, color: colors.forest },
  p: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.mutedDark },
  legend: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, backgroundColor: colors.cream },
  cta: { minHeight: 56, paddingHorizontal: 28, borderRadius: 999, backgroundColor: colors.green, flexDirection: 'row', alignItems: 'center', gap: 10 },
  ctaText: { fontFamily: fonts.bold, fontSize: 17, color: colors.paper },
});
