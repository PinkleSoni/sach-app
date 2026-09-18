import React, { useMemo, useState } from 'react';
import { Image, Linking, ScrollView, Share, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { getProduct, allProducts } from '../lib/catalog';
import { matchProduct, verdictLine, relevantIngredients, isLikeMe, summariseReviews, durationMonths } from '../lib/match';
import { Btn, Eyebrow, Pill } from '../components/ui';
import Icon, { MatchRing } from '../components/Icon';
import VoiceNote from '../components/VoiceNote';
import { colors, fonts } from '../theme';

const VERDICT = {
  'Not for you': { ring: colors.coral, pillBg: colors.coral, pillFg: colors.forest },
  'Mixed fit': { ring: colors.amber, pillBg: colors.amber, pillFg: colors.forest },
  'Good for you': { ring: colors.greenGood, pillBg: colors.greenLight, pillFg: colors.forest },
};

export default function ResultScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, reviewsFor, wishlist, toggleWishlist, helpful, toggleHelpful, addRecent } = useApp();
  const product = getProduct(route.params.productId);
  const p = profile || {};
  const [tab, setTab] = useState('like');
  const [allIngredients, setAllIngredients] = useState(false);

  const m = useMemo(() => matchProduct(product, p), [product, p]);
  const key = VERDICT[m.verdict];
  const ingredients = useMemo(() => relevantIngredients(product, p), [product, p]);
  const fullList = useMemo(
    () => product.ingredients.map((i) => ingredients.find((x) => x.name === i.name) || { name: i.name, note: i.note, tone: 'plain' }),
    [product, ingredients]
  );
  const alternatives = useMemo(
    () =>
      allProducts()
        .filter((x) => x.id !== product.id && x.category === product.category)
        .map((x) => ({ product: x, m: matchProduct(x, p) }))
        .filter((x) => !x.m.dealbreakers.length && x.m.score > m.score)
        .sort((a, b) => b.m.score - a.m.score)
        .slice(0, 5),
    [product, p, m.score]
  );

  const mineKeys = Object.keys(p).filter((k) => p[k]);
  const overlap = (r) => r.traits.filter((t) => mineKeys.includes(t)).length;
  const all = reviewsFor(product.id);
  const likeMe = all.filter((r) => isLikeMe(r, p));
  const shown = (tab === 'like' ? likeMe : all).slice().sort((a, b) => (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || overlap(b) - overlap(a));
  const summary = summariseReviews(shown);
  const longest = shown.filter((r) => !r.mine).reduce((best, r) => (durationMonths(r.duration) > (best ? durationMonths(best.duration) : 0) ? r : best), null);
  const photos = shown.flatMap((r) => r.photos || []);
  const saved = wishlist.includes(product.id);

  const share = async () => {
    const message = `${product.name}: ${m.score}% match for me on Sach (${m.verdict.toLowerCase()}).`;
    try {
      await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
    } catch {
      Share.share({ message }).catch(() => {});
    }
  };

  const openAlt = (id) => {
    addRecent(id);
    navigation.push('Result', { productId: id });
  };

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={[s.nav, { paddingTop: insets.top }]}>
          <Btn label="Back" onPress={() => navigation.goBack()} style={s.navBtn}><Icon name="back" color={colors.forest} /></Btn>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Btn label="Share on WhatsApp" onPress={share} style={s.navBtn}><Icon name="share" size={21} color={colors.forest} /></Btn>
            <Btn label={saved ? 'Remove from wishlist' : 'Save to wishlist'} onPress={() => toggleWishlist(product.id)} style={s.navBtn}>
              <Icon name="bookmark" size={21} color={colors.forest} fill={saved ? colors.forest : 'none'} />
            </Btn>
          </View>
        </View>

        <View style={s.body}>
          <View style={{ gap: 4 }}>
            <Eyebrow>{product.brand} · {product.category}</Eyebrow>
            <Text style={s.title} accessibilityRole="header">{product.name}</Text>
          </View>

          <View style={s.matchCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
              <View style={s.ringBox}>
                <View style={StyleSheet.absoluteFill}><MatchRing score={m.score} color={key.ring} track={colors.forestSoft} /></View>
                <Text style={s.score}>{m.hasProfile ? `${m.score}%` : '–'}</Text>
                <Text style={s.scoreLabel}>your match</Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                {m.hasProfile && <Pill bg={key.pillBg} fg={key.pillFg}>{m.verdict.toUpperCase()}</Pill>}
                <Text style={s.verdictLine}>{verdictLine(m)}</Text>
              </View>
            </View>
            {!m.hasProfile && (
              <Btn label="Set your fit" onPress={() => navigation.navigate('Profile')} style={s.setFit}>
                <Text style={s.setFitText}>Set your fit</Text>
              </Btn>
            )}
            <View style={s.checks}>
              {m.checks.map((c) => (
                <View key={c.label} style={[s.check, { backgroundColor: c.pass ? colors.forestMid : colors.coralDark }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon name={c.pass ? 'check' : 'x'} size={14} strokeWidth={3} color={c.pass ? colors.greenLight : colors.coralLight} />
                    <Text style={[s.checkLabel, { color: c.pass ? colors.greenLight : colors.coralLight }]}>{c.label}</Text>
                  </View>
                  <Text style={s.checkDetail}>{c.detail}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <Text style={s.h2} accessibilityRole="header">Ingredients that matter to you</Text>
            <View style={s.card}>
              {(allIngredients ? fullList : ingredients).map((ing, i) => (
                <View key={ing.name} style={[s.ingRow, i > 0 && s.rowTop]}>
                  <View style={[s.ingDot, { backgroundColor: ing.tone === 'avoid' ? colors.coralDeep : ing.tone === 'good' ? colors.greenGood : colors.sandDark }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.ingName}>{ing.name}</Text>
                    <Text style={s.ingNote}>{ing.note}</Text>
                  </View>
                  {ing.tone !== 'plain' && <Text style={[s.ingTag, { color: ing.tone === 'avoid' ? colors.coralInk : colors.green }]}>{ing.tone === 'avoid' ? 'Avoid' : 'Good for you'}</Text>}
                </View>
              ))}
              {!allIngredients && !ingredients.length && <Text style={[s.ingNote, { padding: 16 }]}>Nothing here conflicts with your fit.</Text>}
              <Btn label={allIngredients ? 'Show fewer ingredients' : `See all ${product.ingredients.length} ingredients`} onPress={() => setAllIngredients((v) => !v)} style={[s.seeAll, s.rowTop]}>
                <Text style={s.link}>{allIngredients ? 'Show fewer' : `See all ${product.ingredients.length} ingredients`}</Text>
              </Btn>
            </View>
          </View>

          {alternatives.length > 0 && (
            <View style={{ gap: 12 }}>
              <Text style={s.h2} accessibilityRole="header">Better for you</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 20 }} style={{ marginRight: -20 }}>
                {alternatives.map(({ product: a, m: am }) => (
                  <Btn key={a.id} label={`${a.name}, ${am.score}% match`} onPress={() => openAlt(a.id)} style={s.alt}>
                    <View style={s.altPhoto}><Text style={s.altMono}>{a.brand.split(' ').map((w) => w[0]).join('').slice(0, 2)}</Text></View>
                    <Text style={s.altName} numberOfLines={2}>{a.name}</Text>
                    <Text style={s.altScore}>{am.score}% match</Text>
                    <Text style={s.altSub} numberOfLines={1}>{am.checks.filter((c) => c.pass && c.hard).slice(0, 2).map((c) => c.label).join(' · ') || a.brand}</Text>
                  </Btn>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ gap: 14 }}>
            <Text style={s.h2} accessibilityRole="header">What people like you say</Text>
            <View style={s.seg} accessibilityRole="tablist">
              {[['like', 'People like me'], ['all', 'Everyone']].map(([id, label]) => (
                <Btn key={id} label={label} selected={tab === id} onPress={() => setTab(id)} style={[s.segBtn, tab === id && s.segOn]}>
                  <Text style={[s.segText, { color: tab === id ? colors.cream : colors.mutedDark }]}>{label}</Text>
                </Btn>
              ))}
            </View>

            {summary ? (
              <View style={[s.card, { padding: 16, gap: 12 }]}>
                <Eyebrow>{tab === 'like' ? 'Summary of reviews from people like you' : 'Summary of all reviews'}</Eyebrow>
                <Text style={s.summary}>{summary.text}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {summary.chips.map((c) => (
                    <View key={c.label} style={[s.tag, { backgroundColor: c.good ? colors.greenTint : colors.coralTint }]}>
                      <Text style={[s.tagText, { color: c.good ? colors.greenInk : colors.coralTintInk }]}>{c.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={[s.card, { padding: 16 }]}>
                <Text style={s.summary}>{tab === 'like' ? 'No reviews from people like you yet.' : 'No reviews yet.'} Be the first.</Text>
              </View>
            )}

            {photos.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text style={s.photoTitle}>Real photos from reviewers</Text>
                <View style={s.photoGrid}>
                  {photos.slice(0, photos.length > 4 ? 3 : 4).map((uri) => <Image key={uri} source={{ uri }} style={s.photo} accessibilityLabel="Reviewer photo" />)}
                  {photos.length > 4 && (
                    <View style={[s.photo, s.photoMore]}><Text style={s.photoMoreText}>+{photos.length - 3}</Text></View>
                  )}
                </View>
              </View>
            )}

            {shown.map((r, i) => (
              <View key={r.id} style={[s.card, { padding: 16, gap: 10 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  {r.mine ? <Pill bg={colors.greenTint} fg={colors.greenInk}>Your review</Pill>
                    : i === 0 && overlap(r) > 0 ? <Pill bg={colors.amberTint} fg={colors.amberInk}>Closest match to you</Pill>
                    : longest && r.id === longest.id && durationMonths(r.duration) >= 3 ? <Pill bg={colors.greenTint} fg={colors.greenInk}>Used the longest</Pill>
                    : r.seed ? <Pill bg={colors.sand} fg={colors.mutedDark}>Sample review</Pill> : <View />}
                  <Text style={s.rating}>{r.rating}/5</Text>
                </View>
                {!!r.text && <Text style={s.reviewText}>“{r.text}”</Text>}
                {r.voice && <VoiceNote uri={r.voice.uri} seconds={r.voice.seconds} />}
                {r.tags.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {r.tags.map((t) => <View key={t} style={[s.tag, { backgroundColor: colors.sand }]}><Text style={[s.tagText, { color: colors.mutedDark }]}>{t}</Text></View>)}
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={[s.ingNote, { flex: 1 }]}>{r.name} · {r.traits.filter((t) => !['Fragrance', 'Nuts'].includes(t)).slice(0, 2).join(', ') || 'No profile'} · {r.duration}</Text>
                  {!r.mine && (
                    <Btn label="Helpful" selected={helpful.includes(r.id)} onPress={() => toggleHelpful(r.id)} style={[s.helpful, helpful.includes(r.id) && { backgroundColor: colors.greenTint, borderColor: colors.greenGood }]}>
                      <Text style={s.helpfulText}>{helpful.includes(r.id) ? 'Helpful ✓' : 'Helpful'}</Text>
                    </Btn>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.footTitle}>Used it?</Text>
          <Text style={s.ingNote}>Help the next person like you</Text>
        </View>
        <Btn label="Review in 3 taps" onPress={() => navigation.navigate('Review', { productId: product.id })} style={s.cta}>
          <Text style={s.ctaText}>Review in 3 taps</Text>
        </Btn>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { gap: 26, paddingHorizontal: 20, paddingTop: 4 },
  title: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 29, color: colors.forest },
  matchCard: { borderRadius: 28, backgroundColor: colors.forest, padding: 22, gap: 18 },
  ringBox: { width: 116, height: 116, alignItems: 'center', justifyContent: 'center' },
  score: { fontFamily: fonts.serif, fontSize: 34, color: colors.cream },
  scoreLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.cream, opacity: 0.8 },
  verdictLine: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23, color: colors.cream },
  setFit: { minHeight: 48, borderRadius: 14, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  setFitText: { fontFamily: fonts.bold, fontSize: 15, color: colors.forest },
  checks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  check: { width: '48.5%', padding: 12, borderRadius: 16, gap: 4 },
  checkLabel: { fontFamily: fonts.bold, fontSize: 14 },
  checkDetail: { fontFamily: fonts.regular, fontSize: 13, color: colors.cream, opacity: 0.85 },
  h2: { fontFamily: fonts.serif, fontSize: 22, color: colors.forest },
  card: { borderRadius: 20, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  rowTop: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  ingDot: { width: 10, height: 10, borderRadius: 5 },
  ingName: { fontFamily: fonts.bold, fontSize: 15, color: colors.forest },
  ingNote: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  ingTag: { fontFamily: fonts.bold, fontSize: 12 },
  seeAll: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16 },
  link: { fontFamily: fonts.semibold, fontSize: 15, color: colors.green },
  alt: { width: 150, borderRadius: 20, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, padding: 10, gap: 8 },
  altPhoto: { height: 110, borderRadius: 14, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  altMono: { fontFamily: fonts.serif, fontSize: 32, color: colors.sandDark },
  altName: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 17, color: colors.forest },
  altScore: { fontFamily: fonts.bold, fontSize: 13, color: colors.green },
  altSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  seg: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 999, backgroundColor: colors.sand },
  segBtn: { flex: 1, minHeight: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.forest },
  segText: { fontFamily: fonts.bold, fontSize: 15 },
  summary: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: colors.forest },
  tag: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  tagText: { fontFamily: fonts.semibold, fontSize: 13 },
  photoTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.forest },
  photoGrid: { flexDirection: 'row', gap: 6 },
  photo: { flex: 1, aspectRatio: 1, borderRadius: 12, backgroundColor: colors.sand },
  photoMore: { backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  photoMoreText: { fontFamily: fonts.bold, fontSize: 13, color: colors.cream },
  rating: { fontFamily: fonts.bold, fontSize: 13, color: colors.forest },
  reviewText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.forest },
  helpful: { minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: colors.sandDark, backgroundColor: colors.paper, justifyContent: 'center' },
  helpfulText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.forest },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line },
  footTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.forest },
  cta: { minHeight: 52, paddingHorizontal: 20, borderRadius: 16, backgroundColor: colors.green, justifyContent: 'center' },
  ctaText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
});
