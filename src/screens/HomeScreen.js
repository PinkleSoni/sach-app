import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { getProduct } from '../lib/catalog';
import { profileSummary } from '../lib/match';
import { Btn } from '../components/ui';
import Icon from '../components/Icon';
import Glow from '../components/Glow';
import { colors, fonts } from '../theme';

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

// Expanding ring behind the scan button.
function PulseRing({ delay, reduce }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(t); loop.stop(); };
  }, [reduce, delay, v]);
  if (reduce) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, s.ring, {
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
      }]}
    />
  );
}

// Amber line sweeping up and down the barcode frame.
function ScanLine({ reduce }) {
  const v = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (reduce) return undefined;
    v.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, v]);
  return <Animated.View style={[s.scanLine, { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-58, 58] }) }] }]} />;
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const { profile, recents, myReviews } = useApp();

  // Nudge for the latest check you haven't reviewed yet.
  const reviewed = new Set(myReviews.map((r) => r.productId));
  const toReview = recents.map(getProduct).filter(Boolean).find((p) => !reviewed.has(p.id));

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12 }]} showsVerticalScrollIndicator={false}>
        <View style={s.top}>
          <Text style={s.brand}>Sach</Text>
          <Btn label="Edit your fit" onPress={() => navigation.navigate('Fit')} style={s.fitPill}>
            <Text style={s.fitText} numberOfLines={1}>{profileSummary(profile || {})}</Text>
            <View style={s.avatar}><Text style={s.avatarText}>P</Text></View>
          </Btn>
        </View>

        <Btn label="Open camera and scan a product" onPress={() => navigation.navigate('Check')} style={s.hero}>
          <Glow id="homeGlow" inner="#2E4236" outer={colors.forest} cx={0.5} cy={0.42} rx={0.9} ry={0.6} />
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={s.heroTitle}>Buying something?{'\n'}Scan it first.</Text>
            <Text style={s.heroSub}>Know in seconds if it suits you</Text>
          </View>

          <View style={s.frame}>
            <Svg width={190} height={140} viewBox="0 0 190 140" fill="none" style={StyleSheet.absoluteFill}>
              <Path d="M3 34V3h31M156 3h31v31M187 106v31h-31M34 137H3v-31" stroke={colors.amber} strokeWidth={5} strokeLinecap="round" />
              <Path d="M40 38v64M52 38v64M60 38v64M74 38v64M84 38v64M98 38v64M112 38v64M120 38v64M134 38v64M142 38v64M150 38v64" stroke={colors.cream} strokeOpacity={0.22} strokeWidth={3} strokeLinecap="round" />
            </Svg>
            <ScanLine reduce={reduce} />
          </View>

          <View style={{ alignItems: 'center', gap: 12 }}>
            <View style={s.camWrap}>
              <PulseRing delay={0} reduce={reduce} />
              <PulseRing delay={900} reduce={reduce} />
              <View style={s.cam}><Icon name="camera" size={38} color={colors.forest} /></View>
            </View>
            <Text style={s.tap}>Tap to scan</Text>
          </View>
        </Btn>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn label="Upload photo" onPress={() => navigation.navigate('Check', { autoGallery: true })} style={s.alt}>
            <Icon name="gallery" size={20} color={colors.forest} /><Text style={s.altText}>Upload photo</Text>
          </Btn>
          <Btn label="Search name" onPress={() => navigation.navigate('Check', { mode: 'Name' })} style={s.alt}>
            <Icon name="search" size={20} color={colors.forest} /><Text style={s.altText}>Search name</Text>
          </Btn>
        </View>

        {toReview && (
          <Btn label={`Review ${toReview.name}`} onPress={() => navigation.navigate('Review', { productId: toReview.id })} style={s.nudge}>
            <View style={s.nudgeThumb} />
            <Text style={s.nudgeText} numberOfLines={2}>
              <Text style={{ fontFamily: fonts.bold }}>Used {toReview.name}?</Text> Review it in 3 taps.
            </Text>
            <Icon name="chevron" size={20} color={colors.forest} strokeWidth={2.2} />
          </Btn>
        )}
        <View style={{ height: 14 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1, paddingHorizontal: 16, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 4 },
  brand: { fontFamily: fonts.serif, fontSize: 26, color: colors.forest },
  fitPill: { minHeight: 44, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 14, paddingRight: 6, borderRadius: 999, backgroundColor: colors.sand },
  fitText: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.forest },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, color: colors.forest },
  hero: { flexGrow: 1, minHeight: 430, borderRadius: 32, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'space-between', paddingTop: 28, paddingBottom: 26, paddingHorizontal: 22, overflow: 'hidden' },
  heroTitle: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 35, color: colors.cream, textAlign: 'center' },
  heroSub: { fontFamily: fonts.regular, fontSize: 15, color: colors.cream, opacity: 0.8 },
  frame: { width: 190, height: 140, alignItems: 'center', justifyContent: 'center' },
  scanLine: { width: 150, height: 2, backgroundColor: colors.amber, shadowColor: colors.amber, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  camWrap: { width: 92, height: 92, alignItems: 'center', justifyContent: 'center' },
  ring: { borderRadius: 46, backgroundColor: colors.amber },
  cam: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  tap: { fontFamily: fonts.bold, fontSize: 18, color: colors.cream },
  alt: { flex: 1, minHeight: 52, borderRadius: 16, borderWidth: 1.5, borderColor: colors.sandDark, backgroundColor: colors.paper, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  altText: { fontFamily: fonts.bold, fontSize: 15, color: colors.forest },
  nudge: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingLeft: 8, paddingRight: 12, borderRadius: 18, backgroundColor: colors.sand },
  nudgeThumb: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.paper },
  nudgeText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 18, color: colors.forest },
});
