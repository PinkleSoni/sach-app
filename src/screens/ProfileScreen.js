import React, { useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { PROFILE_GROUPS } from '../lib/match';
import { Btn, Chip, Eyebrow } from '../components/ui';
import Icon from '../components/Icon';
import { colors, fonts } from '../theme';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, setProfile } = useApp();
  const first = profile == null;
  const [sel, setSel] = useState(profile || {});

  const save = () => {
    setProfile(sel);
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('Check');
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {!first && (
          <Btn label="Back" onPress={() => navigation.goBack()} style={s.back}>
            <Icon name="back" color={colors.forest} />
          </Btn>
        )}
        <View style={s.head}>
          <Eyebrow>{first ? 'One-time setup' : 'Your fit'}</Eyebrow>
          <Text style={s.title} accessibilityRole="header">Set your fit once. We check every product against it.</Text>
        </View>
        {PROFILE_GROUPS.map((g) => (
          <View key={g.title} style={s.group}>
            <Text style={s.legend}>{g.title}</Text>
            <View style={s.chips}>
              {g.items.map((label) => (
                <Chip key={label} label={label} on={!!sel[label]} onPress={() => setSel((p) => ({ ...p, [label]: !p[label] }))} />
              ))}
            </View>
          </View>
        ))}
        <Text style={s.note}>Your fit stays on this phone.</Text>
      </ScrollView>
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Btn onPress={save} label="Save my fit" style={s.cta}>
          <Text style={s.ctaText}>Save my fit</Text>
        </Btn>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  back: { width: 44, height: 44, justifyContent: 'center', marginLeft: -10 },
  head: { gap: 8, paddingTop: 16, paddingBottom: 8 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34, color: colors.forest },
  group: { marginTop: 20, gap: 10 },
  legend: { fontFamily: fonts.bold, fontSize: 15, color: colors.forest },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  note: { marginTop: 24, fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.cream },
  cta: { minHeight: 56, borderRadius: 16, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: fonts.bold, fontSize: 17, color: colors.paper },
});
