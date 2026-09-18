import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { getProduct } from '../lib/catalog';
import { matchProduct } from '../lib/match';
import { Btn } from '../components/ui';
import Icon from '../components/Icon';
import { colors, fonts } from '../theme';

export default function RecentScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { recents, wishlist, profile, addRecent } = useApp();
  const p = profile || {};
  const items = recents.map(getProduct).filter(Boolean);
  const saved = wishlist.map(getProduct).filter(Boolean);

  const open = (id) => {
    addRecent(id);
    navigation.replace('Result', { productId: id });
  };

  const Row = ({ product }) => {
    const m = matchProduct(product, p);
    const bad = m.dealbreakers.length > 0;
    return (
      <Btn label={`${product.name}${m.hasProfile ? `, ${m.score}% match` : ''}`} onPress={() => open(product.id)} style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.brand}>{product.brand}</Text>
          <Text style={s.name} numberOfLines={2}>{product.name}</Text>
        </View>
        {m.hasProfile && <Text style={[s.score, { color: bad ? colors.coralInk : colors.green }]}>{m.score}%</Text>}
      </Btn>
    );
  };

  return (
    <View style={[s.root, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={s.head}>
        <Text style={s.title} accessibilityRole="header">Your checks</Text>
        <Btn label="Close" onPress={() => navigation.goBack()} style={s.close}><Icon name="x" color={colors.forest} /></Btn>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: insets.bottom + 24 }}>
        {saved.length > 0 && <Text style={s.label}>Saved</Text>}
        {saved.map((x) => <Row key={'w' + x.id} product={x} />)}
        <Text style={[s.label, saved.length > 0 && { marginTop: 14 }]}>Recent</Text>
        {items.map((x) => <Row key={x.id} product={x} />)}
        {!items.length && <Text style={s.empty}>Nothing checked yet. Scan a barcode or search by name and it will show up here.</Text>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 8 },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.forest },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase', color: colors.muted },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  brand: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.muted },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.forest },
  score: { fontFamily: fonts.bold, fontSize: 15 },
  empty: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.muted },
});
