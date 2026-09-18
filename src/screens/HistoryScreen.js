import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { getProduct } from '../lib/catalog';
import { matchProduct } from '../lib/match';
import { Btn } from '../components/ui';
import { colors, fonts } from '../theme';

export function ProductRow({ product, profile, onPress }) {
  const m = matchProduct(product, profile);
  const bad = m.dealbreakers.length > 0;
  return (
    <Btn label={`${product.name}${m.hasProfile ? `, ${m.score}% match` : ''}`} onPress={onPress} style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.brand}>{product.brand}</Text>
        <Text style={s.name} numberOfLines={2}>{product.name}</Text>
      </View>
      {m.hasProfile && <Text style={[s.score, { color: bad ? colors.coralInk : colors.green }]}>{m.score}%</Text>}
    </Btn>
  );
}

export default function HistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { recents, wishlist, profile, addRecent } = useApp();
  const p = profile || {};
  const items = recents.map(getProduct).filter(Boolean);
  const saved = wishlist.map(getProduct).filter(Boolean);
  const open = (id) => {
    addRecent(id);
    navigation.navigate('Result', { productId: id });
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 12 }]}>
      <Text style={s.title} accessibilityRole="header">History</Text>
      <ScrollView contentContainerStyle={s.scroll}>
        {saved.length > 0 && <Text style={s.label}>Saved</Text>}
        {saved.map((x) => <ProductRow key={'w' + x.id} product={x} profile={p} onPress={() => open(x.id)} />)}
        <Text style={[s.label, saved.length > 0 && { marginTop: 14 }]}>Recent checks</Text>
        {items.map((x) => <ProductRow key={x.id} product={x} profile={p} onPress={() => open(x.id)} />)}
        {!items.length && <Text style={s.empty}>Nothing checked yet. Scan a barcode or search by name and it will show up here.</Text>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.forest, paddingHorizontal: 20 },
  scroll: { padding: 20, gap: 10, paddingBottom: 24 },
  label: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase', color: colors.muted },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  brand: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.muted },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.forest },
  score: { fontFamily: fonts.bold, fontSize: 15 },
  empty: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.muted },
});
