import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { getProduct } from '../lib/catalog';
import { Btn, Eyebrow } from '../components/ui';
import VoiceNote from '../components/VoiceNote';
import Icon from '../components/Icon';
import { colors, fonts } from '../theme';

export default function ReviewsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { myReviews, recents } = useApp();
  const reviewed = new Set(myReviews.map((r) => r.productId));
  const waiting = recents.map(getProduct).filter((p) => p && !reviewed.has(p.id));

  return (
    <View style={[s.root, { paddingTop: insets.top + 12 }]}>
      <Text style={s.title} accessibilityRole="header">Reviews</Text>
      <ScrollView contentContainerStyle={s.scroll}>
        {waiting.length > 0 && (
          <View style={{ gap: 10 }}>
            <Eyebrow>Used it? Review in 3 taps</Eyebrow>
            {waiting.map((p) => (
              <Btn key={p.id} label={`Review ${p.name}`} onPress={() => navigation.navigate('Review', { productId: p.id })} style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.brand}>{p.brand}</Text>
                  <Text style={s.name} numberOfLines={2}>{p.name}</Text>
                </View>
                <Icon name="chevron" size={20} color={colors.forest} strokeWidth={2.2} />
              </Btn>
            ))}
          </View>
        )}

        <View style={{ gap: 10 }}>
          <Eyebrow>Your reviews</Eyebrow>
          {myReviews.map((r) => {
            const p = getProduct(r.productId);
            return (
              <View key={r.id} style={s.card}>
                <Btn label={`Open ${p?.name}`} onPress={() => navigation.navigate('Result', { productId: r.productId })} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <Text style={[s.name, { flex: 1 }]} numberOfLines={2}>{p?.name || 'Product'}</Text>
                    <Text style={s.rating}>{r.rating}/5</Text>
                  </View>
                </Btn>
                {!!r.text && <Text style={s.text}>“{r.text}”</Text>}
                {r.voice && <VoiceNote uri={r.voice.uri} seconds={r.voice.seconds} />}
                {r.tags.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {r.tags.map((t) => <View key={t} style={s.tag}><Text style={s.tagText}>{t}</Text></View>)}
                  </View>
                )}
              </View>
            );
          })}
          {!myReviews.length && <Text style={s.empty}>You haven’t reviewed anything yet. Scan a product, then tell the next person like you how it went.</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.forest, paddingHorizontal: 20 },
  scroll: { padding: 20, gap: 22, paddingBottom: 24 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  brand: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.muted },
  name: { fontFamily: fonts.bold, fontSize: 16, color: colors.forest },
  card: { padding: 16, gap: 10, borderRadius: 20, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  rating: { fontFamily: fonts.bold, fontSize: 13, color: colors.forest },
  text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.forest },
  tag: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.sand },
  tagText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.mutedDark },
  empty: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.muted },
});
