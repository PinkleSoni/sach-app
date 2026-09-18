import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Btn } from '../components/ui';
import Icon, { MatchRing } from '../components/Icon';
import { colors, fonts } from '../theme';

const FLOATERS = [
  { label: 'Vegan', bg: colors.greenTint, fg: colors.greenInk, pos: { top: 34, left: -6 } },
  { label: 'Fragrance-free', bg: colors.amberTint, fg: colors.amberInk, pos: { top: 90, right: -10 } },
  { label: 'No nuts', bg: colors.paper, fg: colors.forest, pos: { bottom: 70, left: -12 } },
  { label: 'Oily skin', bg: colors.greenTint, fg: colors.greenInk, pos: { bottom: 24, right: 6 } },
];

export function StepDots({ step, total = 2 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }} accessibilityLabel={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ height: 8, width: i + 1 === step ? 24 : 8, borderRadius: 4, backgroundColor: i + 1 === step ? colors.forest : colors.sandDark }} />
      ))}
    </View>
  );
}

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { setProfile } = useApp();

  const skip = () => {
    setProfile({});
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
      <View style={s.top}>
        <Text style={s.brand}>Sach</Text>
        <Btn label="Skip" onPress={skip} style={s.skip}><Text style={s.skipText}>Skip</Text></Btn>
      </View>

      <View style={s.stage}>
        <View style={s.panel}>
          <View style={s.card}>
            <View style={s.ringBox}>
              <View style={StyleSheet.absoluteFill}><MatchRing score={91} size={96} stroke={10} color={colors.green} track={colors.sand} /></View>
              <Text style={s.ringText}>91%</Text>
            </View>
            <Text style={s.good}>Good fit for you</Text>
            <View style={[s.bar, { width: 120 }]} />
            <View style={[s.bar, { width: 90 }]} />
          </View>
          {FLOATERS.map((f) => (
            <View key={f.label} style={[s.floater, f.pos, { backgroundColor: f.bg }]}>
              <Text style={[s.floaterText, { color: f.fg }]}>{f.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.copy}>
        <Text style={s.h1} accessibilityRole="header">Know if it suits you before you buy.</Text>
        <Text style={s.p}>Scan any beauty or wellness product. Sach checks it against your allergies and needs, then shows honest reviews from people like you.</Text>
      </View>

      <View style={s.footer}>
        <StepDots step={1} />
        <Btn label="Next" onPress={() => navigation.navigate('FitSetup')} style={s.next}>
          <Text style={s.nextText}>Next</Text>
          <Icon name="arrow" size={20} color={colors.paper} strokeWidth={2.2} />
        </Btn>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  brand: { fontFamily: fonts.serif, fontSize: 24, color: colors.forest },
  skip: { minHeight: 44, paddingHorizontal: 4, justifyContent: 'center' },
  skipText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.mutedDark },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  panel: { width: 320, height: 340, borderRadius: 36, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  card: { width: 190, padding: 18, borderRadius: 24, backgroundColor: colors.paper, alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  ringBox: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  ringText: { fontFamily: fonts.serif, fontSize: 28, color: colors.forest },
  good: { fontFamily: fonts.bold, fontSize: 14, color: colors.green },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.sand },
  floater: { position: 'absolute', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  floaterText: { fontFamily: fonts.bold, fontSize: 14 },
  copy: { gap: 12, paddingHorizontal: 24 },
  h1: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 37, color: colors.forest },
  p: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.mutedDark },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 28 },
  next: { minHeight: 56, paddingHorizontal: 28, borderRadius: 999, backgroundColor: colors.green, flexDirection: 'row', alignItems: 'center', gap: 10 },
  nextText: { fontFamily: fonts.bold, fontSize: 17, color: colors.paper },
});
