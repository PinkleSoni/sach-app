import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Text, TextInput, View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions, scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { getProductByBarcode, searchProducts, allProducts } from '../lib/catalog';
import { matchProduct, profileSummary } from '../lib/match';
import { Btn } from '../components/ui';
import Icon from '../components/Icon';
import Glow from '../components/Glow';
import { colors, fonts } from '../theme';

const MODES = ['Barcode', 'Label', 'Name'];
const HINTS = {
  Barcode: 'Hold steady on the barcode',
  Label: 'Reading ingredient labels is coming soon',
  Name: 'Type a product name to search',
};
const BARCODES = ['ean13', 'ean8', 'upc_a', 'upc_e'];

export default function CheckScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { profile, addRecent } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState(route.params?.mode || 'Barcode');
  const [torch, setTorch] = useState(false);
  const [found, setFound] = useState(null); // { product } | { unknown }
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');

  const p = profile || {};
  const open = useCallback(
    (product) => {
      addRecent(product.id);
      setFound(null);
      navigation.navigate('Result', { productId: product.id });
    },
    [addRecent, navigation]
  );

  const handleCode = useCallback((code) => {
    const product = getProductByBarcode(code);
    Haptics.notificationAsync(product ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setNotice('');
    setFound(product ? { product } : { unknown: code });
  }, []);

  const pickFromGallery = async () => {
    setNotice('');
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (res.canceled || !res.assets?.[0]) return;
      const hits = await scanFromURLAsync(res.assets[0].uri, BARCODES);
      if (hits.length) handleCode(hits[0].data);
      else setNotice('No barcode found in that photo. Try a closer, sharper shot.');
    } catch {
      setNotice('Could not read that photo. Try another one.');
    }
  };

  useEffect(() => {
    if (route.params?.mode) setMode(route.params.mode);
  }, [route.params?.mode]);

  useEffect(() => {
    if (route.params?.autoGallery) {
      navigation.setParams({ autoGallery: false });
      pickFromGallery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.autoGallery]);

  const goHome = () => navigation.popTo('Tabs', { screen: 'Home' });
  const editFit = () => navigation.popTo('Tabs', { screen: 'Fit' });

  const shutter = () => {
    if (found?.product) return open(found.product);
    if (mode === 'Label') return setNotice('Label reading is coming soon. Scan the barcode or search by name for now.');
    setNotice('Point the camera at a barcode. It scans on its own.');
  };

  const cameraOn = focused && permission?.granted && mode !== 'Name';
  const scanning = cameraOn && mode === 'Barcode' && !found;
  const nameResults = query.trim() ? searchProducts(query) : allProducts();

  return (
    <View style={s.root}>
      {focused && <StatusBar style="light" />}
      {cameraOn && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: BARCODES }}
          onBarcodeScanned={scanning ? ({ data }) => handleCode(data) : undefined}
        />
      )}
      {!cameraOn && <Glow id="checkGlow" inner="#2A3A31" outer={colors.night} cx={0.5} cy={0.38} rx={1.2} ry={0.7} />}
      <View style={s.scrim} pointerEvents="none" />

      <View style={[s.top, { paddingTop: insets.top + 8 }]}>
        <Btn label="Back to home" onPress={goHome} style={s.round}>
          <Icon name="back" size={22} color={colors.cream} strokeWidth={2.2} />
        </Btn>
        <Btn label="Edit your fit profile" onPress={editFit} style={s.fitPill}>
          <View style={s.fitDot} />
          <Text style={s.fitText} numberOfLines={1}>{profileSummary(p)}</Text>
        </Btn>
        <Btn label={torch ? 'Turn off torch' : 'Turn on torch'} onPress={() => setTorch((t) => !t)} style={[s.round, torch && { backgroundColor: colors.amber }]}>
          <Icon name="bolt" size={20} color={torch ? colors.forest : colors.cream} />
        </Btn>
      </View>

      {mode === 'Name' ? (
        <View style={s.nameWrap}>
          <View style={s.searchRow}>
            <Icon name="search" size={20} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="e.g. gel moisturiser, hair oil"
              placeholderTextColor={colors.muted}
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search by product name"
              style={s.searchInput}
            />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
            <Text style={s.listLabel}>{query.trim() ? `${nameResults.length} found` : 'Try one of these'}</Text>
            {nameResults.map((pr) => {
              const m = matchProduct(pr, p);
              return (
                <Btn key={pr.id} label={`${pr.name}, ${m.score}% match`} onPress={() => open(pr)} style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowBrand}>{pr.brand}</Text>
                    <Text style={s.rowName} numberOfLines={2}>{pr.name}</Text>
                  </View>
                  <Text style={[s.rowScore, { color: m.dealbreakers.length ? colors.coralInk : colors.green }]}>{m.hasProfile ? `${m.score}%` : ''}</Text>
                </Btn>
              );
            })}
            {!nameResults.length && <Text style={s.empty}>Nothing matched. Try fewer words, or scan the barcode.</Text>}
          </ScrollView>
        </View>
      ) : (
        <View style={s.middle}>
          {permission && !permission.granted ? (
            <View style={s.permCard}>
              <Text style={s.permTitle}>Sach needs your camera to scan barcodes.</Text>
              <Text style={s.permBody}>Photos are read on your phone. You can also search by name.</Text>
              {permission.canAskAgain ? (
                <Btn label="Allow camera" onPress={requestPermission} style={s.permBtn}><Text style={s.permBtnText}>Allow camera</Text></Btn>
              ) : (
                <Btn label="Open settings" onPress={() => Linking.openSettings()} style={s.permBtn}><Text style={s.permBtnText}>Open settings</Text></Btn>
              )}
              <Btn label="Search by name" onPress={() => setMode('Name')} style={s.permLink}><Text style={s.permLinkText}>Search by name instead</Text></Btn>
            </View>
          ) : (
            <>
              <View style={s.frame}>
                <Svg width={260} height={200} viewBox="0 0 260 200" fill="none" stroke={colors.amber} strokeWidth={5} strokeLinecap="round" style={StyleSheet.absoluteFill}>
                  <Path d="M3 44V3h41M216 3h41v41M257 156v41h-41M44 197H3v-41" />
                </Svg>
                <View style={s.scanLine} />
              </View>
              <Text style={s.hint} accessibilityLiveRegion="polite">{notice || HINTS[mode]}</Text>
            </>
          )}
        </View>
      )}

      {found && (
        found.product ? (
          <FoundCard product={found.product} profile={p} onOpen={() => open(found.product)} onClose={() => setFound(null)} />
        ) : (
          <View style={s.found}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={s.foundEyebrow}>Not in our catalog yet</Text>
              <Text style={s.foundName}>Barcode {found.unknown}</Text>
              <Text style={s.foundSub}>Try searching by name.</Text>
            </View>
            <Btn label="Search by name" onPress={() => { setFound(null); setMode('Name'); }} style={s.foundBtn}><Text style={s.foundBtnText}>Search</Text></Btn>
            <Btn label="Scan again" onPress={() => setFound(null)} style={s.foundClose}><Icon name="x" size={18} color={colors.forest} /></Btn>
          </View>
        )
      )}

      <View style={[s.bottom, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={s.tabs} accessibilityRole="tablist">
          {MODES.map((m) => (
            <Btn key={m} label={m === 'Label' ? 'Label (coming soon)' : m} selected={mode === m} onPress={() => { setMode(m); setNotice(''); }} style={[s.tab, mode === m && s.tabOn]}>
              <Text style={[s.tabText, { color: mode === m ? colors.forest : '#C9C1B2' }]}>{m}</Text>
            </Btn>
          ))}
        </View>
        <View style={s.controls}>
          <Btn label="Pick from gallery" onPress={pickFromGallery} style={s.square}><Icon name="gallery" color={colors.cream} /></Btn>
          {mode !== 'Name' ? (
            <Btn label="Check this product" onPress={shutter} style={s.shutter}><View style={s.shutterInner} /></Btn>
          ) : (
            <View style={{ width: 76 }} />
          )}
          <Btn label="Recent checks" onPress={() => navigation.popTo('Tabs', { screen: 'History' })} style={s.square}><Icon name="clock" color={colors.cream} /></Btn>
        </View>
      </View>
    </View>
  );
}

function FoundCard({ product, profile, onOpen, onClose }) {
  const m = matchProduct(product, profile);
  const bad = m.dealbreakers.length > 0;
  const tone = bad ? colors.coralInk : colors.green;
  return (
    <Btn label={`Found ${product.name}. Open result`} onPress={onOpen} style={s.found}>
      <View style={s.thumb} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.foundEyebrow}>Found it</Text>
        <Text style={s.foundName} numberOfLines={1}>{product.name}</Text>
        {m.hasProfile ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[s.dot, { backgroundColor: bad ? colors.coralDeep : colors.greenGood }]} />
            <Text style={[s.foundSub, { color: tone, fontFamily: fonts.semibold }]}>
              {m.score}% match{bad ? ` · ${m.dealbreakers.length} dealbreaker${m.dealbreakers.length > 1 ? 's' : ''}` : ''}
            </Text>
          </View>
        ) : (
          <Text style={s.foundSub}>Set your fit to see a match</Text>
        )}
      </View>
      <Icon name="chevron" color={colors.forest} />
      <Btn label="Dismiss" onPress={onClose} style={s.foundClose}><Icon name="x" size={18} color={colors.forest} /></Btn>
    </Btn>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(16,26,21,0.35)' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 16 },
  fitPill: { flex: 1, minHeight: 44, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(245,239,228,0.16)' },
  fitDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.amber },
  fitText: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.cream },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,239,228,0.16)' },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 24 },
  frame: { width: 260, height: 200, alignItems: 'center', justifyContent: 'center' },
  scanLine: { width: 200, height: 2, backgroundColor: colors.amber, shadowColor: colors.amber, shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  hint: { fontFamily: fonts.medium, fontSize: 15, color: colors.cream, textAlign: 'center' },
  permCard: { width: '100%', borderRadius: 24, backgroundColor: colors.paper, padding: 20, gap: 10 },
  permTitle: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 26, color: colors.forest },
  permBody: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, lineHeight: 21 },
  permBtn: { minHeight: 52, borderRadius: 14, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  permBtnText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
  permLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  permLinkText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.green },
  nameWrap: { flex: 1, paddingHorizontal: 16, paddingTop: 16, gap: 12, backgroundColor: colors.night },
  searchRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: colors.paper },
  searchInput: { flex: 1, minHeight: 48, fontFamily: fonts.medium, fontSize: 16, color: colors.forest },
  listLabel: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase', color: '#C9C1B2', marginTop: 4 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: colors.paper },
  rowBrand: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.muted },
  rowName: { fontFamily: fonts.bold, fontSize: 16, color: colors.forest },
  rowScore: { fontFamily: fonts.bold, fontSize: 15 },
  empty: { fontFamily: fonts.regular, fontSize: 15, color: '#C9C1B2', paddingVertical: 12 },
  found: { marginHorizontal: 16, marginBottom: 16, padding: 12, borderRadius: 20, backgroundColor: colors.paper, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 14, backgroundColor: colors.sand },
  foundEyebrow: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase', color: colors.muted },
  foundName: { fontFamily: fonts.bold, fontSize: 16, color: colors.forest },
  foundSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  foundBtn: { minHeight: 44, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.green, justifyContent: 'center' },
  foundBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.paper },
  foundClose: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bottom: { backgroundColor: colors.nightDeep, paddingHorizontal: 16, paddingTop: 14, gap: 18 },
  tabs: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tab: { minHeight: 44, paddingHorizontal: 18, borderRadius: 999, justifyContent: 'center' },
  tabOn: { backgroundColor: colors.cream },
  tabText: { fontFamily: fonts.bold, fontSize: 15 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  square: { width: 52, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(245,239,228,0.35)', backgroundColor: '#1F2C25', alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.amber },
});
