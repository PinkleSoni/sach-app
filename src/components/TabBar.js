import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Btn } from './ui';
import Icon from './Icon';
import { colors, fonts } from '../theme';

const META = {
  Home: { label: 'Home', icon: 'home' },
  Reviews: { label: 'Reviews', icon: 'chat' },
  History: { label: 'History', icon: 'clock' },
  Fit: { label: 'My fit', icon: 'user' },
};

// Five slots: Home, Reviews, the raised scan button, History, My fit.
export default function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const item = (route, index) => {
    const focused = state.index === index;
    const m = META[route.name];
    const color = focused ? colors.green : colors.muted;
    return (
      <Btn
        key={route.key}
        label={m.label}
        selected={focused}
        onPress={() => {
          const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
        }}
        style={s.item}
      >
        <Icon name={m.icon} color={color} />
        <Text style={[s.label, { color, fontFamily: focused ? fonts.bold : fonts.semibold }]}>{m.label}</Text>
      </Btn>
    );
  };

  return (
    <View style={s.wrap} pointerEvents="box-none">
      <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        {item(state.routes[0], 0)}
        {item(state.routes[1], 1)}
        <View style={s.item} />
        {item(state.routes[2], 2)}
        {item(state.routes[3], 3)}
      </View>
      <Btn label="Scan a product" onPress={() => navigation.navigate('Check')} style={s.fab}>
        <Icon name="scan" size={26} color={colors.cream} />
      </Btn>
    </View>
  );
}

const FAB = 60;
const s = StyleSheet.create({
  wrap: { paddingTop: FAB / 2 },
  bar: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 8, paddingHorizontal: 8, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line },
  item: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 11 },
  fab: {
    position: 'absolute', top: 0, alignSelf: 'center', width: FAB, height: FAB, borderRadius: FAB / 2,
    backgroundColor: colors.forest, borderWidth: 4, borderColor: colors.cream, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.forest, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
});
