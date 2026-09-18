import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

// Pressable with a 44pt minimum hit area and a pressed state.
export function Btn({ onPress, style, children, label, disabled, hitSlop, selected }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, selected: selected == null ? undefined : !!selected }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && { opacity: 0.75 }]}
    >
      {children}
    </Pressable>
  );
}

export function Chip({ label, on, onPress }) {
  return (
    <Btn onPress={onPress} label={label} selected={on} style={[s.chip, on ? s.chipOn : s.chipOff]}>
      <Text style={[s.chipText, { color: on ? colors.paper : colors.forest }]}>{label}</Text>
    </Btn>
  );
}

export function Pill({ children, bg, fg }) {
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Text style={[s.pillText, { color: fg }]}>{children}</Text>
    </View>
  );
}

export const Eyebrow = ({ children, style }) => <Text style={[s.eyebrow, style]}>{children}</Text>;

const s = StyleSheet.create({
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 999, justifyContent: 'center', borderWidth: 1.5 },
  chipOn: { borderColor: colors.green, backgroundColor: colors.green },
  chipOff: { borderColor: colors.sandDark, backgroundColor: colors.paper },
  chipText: { fontFamily: fonts.semibold, fontSize: 15 },
  pill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, alignSelf: 'flex-start' },
  pillText: { fontFamily: fonts.bold, fontSize: 12 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase', color: colors.muted },
});
