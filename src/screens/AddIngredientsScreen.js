import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { getProduct } from '../lib/catalog';
import { googleSearchUrl, parseIngredientText, submitIngredients } from '../lib/ingredientSources';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Btn, Eyebrow } from '../components/ui';
import Icon from '../components/Icon';
import OcrEngine from '../components/OcrEngine';
import { extractIngredientList } from '../lib/labelText';
import { colors, fonts } from '../theme';

// For a product that has no usable ingredient list: type it in from the pack.
// Applied on this phone straight away, and shared with everyone when signed in.
export default function AddIngredientsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { applyIngredientList } = useApp();
  const product = getProduct(route.params.productId);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const ocr = useRef(null);
  const [scan, setScan] = useState({ busy: false, progress: 0, message: '', error: '' });
  const count = parseIngredientText(text).length;
  const canSave = count >= 3 && !saving;
  const sharing = !!user && !user.isDemo;

  const readPhoto = async (fromCamera) => {
    const options = { mediaTypes: ['images'], quality: 0.7, base64: true, allowsEditing: true };
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setScan({ busy: false, progress: 0, message: '', error: 'Allow camera access in Settings to scan the pack, or choose a photo instead.' });
        return;
      }
    }
    const result = await (fromCamera ? ImagePicker.launchCameraAsync(options) : ImagePicker.launchImageLibraryAsync(options));
    const base64 = !result.canceled && result.assets?.[0]?.base64;
    if (!base64) return;
    setScan({ busy: true, progress: 0, message: '', error: '' });
    try {
      const raw = await ocr.current.recognize(base64, (p) => setScan((s) => ({ ...s, progress: p })));
      const list = extractIngredientList(raw);
      if (list.length < 10) {
        setScan({ busy: false, progress: 0, message: '', error: 'We couldn’t find an ingredient list in that photo. Crop to just the ingredients, in good light, and try again.' });
        return;
      }
      setText(list);
      setScan({ busy: false, progress: 0, message: 'Read from your photo. Scanning can misread letters, so check it against the pack before saving.', error: '' });
    } catch (e) {
      const offline = e.message === 'offline';
      setScan({ busy: false, progress: 0, message: '', error: offline ? 'Couldn’t load the text reader. Check your internet connection and try again, or type the list in.' : 'Couldn’t read that photo. Try again with the ingredient list filling the frame.' });
    }
  };

  const chooseScanSource = () => {
    // Alert has no buttons on web, so go straight to the file picker there.
    if (Platform.OS === 'web') return readPhoto(false);
    Alert.alert('Scan the ingredient list', 'Crop the photo to just the ingredients for the best result.', [
      { text: 'Take a photo', onPress: () => readPhoto(true) },
      { text: 'Choose a photo', onPress: () => readPhoto(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    applyIngredientList(product.id, { source: 'user', text });
    await submitIngredients(String(product.barcode || '').replace(/\D/g, ''), text, user).catch(() => {});
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.top, { paddingTop: insets.top + 8 }]}>
        <Btn label="Back" onPress={() => navigation.goBack()} style={s.back}><Icon name="back" color={colors.forest} strokeWidth={2.2} /></Btn>
        <Text style={s.topTitle}>Add ingredients</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6 }}>
          <Eyebrow>{product.brand}</Eyebrow>
          <Text style={s.h1} accessibilityRole="header">{product.name}</Text>
          <Text style={s.p}>
            {sharing
              ? 'Copy the list from the pack. It’s shared with everyone who checks this product next.'
              : 'Copy the list from the pack. It’s saved on this phone only. Sign in from the My fit tab to share it with everyone.'}
          </Text>
        </View>
        <Btn label="Scan the ingredient list with the camera" onPress={chooseScanSource} disabled={scan.busy} style={[s.scanBtn, scan.busy && { opacity: 0.6 }]}>
          <Text style={s.scanBtnText}>{scan.busy ? `Reading the label… ${Math.round(scan.progress * 100)}%` : 'Scan the ingredient list with the camera'}</Text>
        </Btn>
        {!!scan.error && <Text style={s.scanError}>{scan.error}</Text>}
        {!!scan.message && <Text style={s.scanNote}>{scan.message}</Text>}
        <Btn label="Search Google for the ingredients" onPress={() => Linking.openURL(googleSearchUrl(product))} style={s.googleBtn}>
          <Text style={s.googleBtnText}>Search Google for this product’s ingredients</Text>
        </Btn>
        <Text style={s.hint}>No pack to hand? Search for it, copy the ingredient list from a reliable page (the brand’s own site is best), and paste it below. Check it matches your product’s exact version.</Text>
        <View style={{ gap: 6 }}>
          <Text style={s.label}>Ingredients</Text>
          <Text style={s.hint}>Exactly as printed, separated by commas or new lines. At least three.</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={'Aqua, Glycerin, Niacinamide, ...'}
            placeholderTextColor={colors.muted}
            multiline
            autoCorrect={false}
            style={s.textarea}
          />
          <Text style={s.hint}>{count} {count === 1 ? 'ingredient' : 'ingredients'} found</Text>
        </View>
      </ScrollView>
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Btn label="Save ingredients" disabled={!canSave} onPress={save} style={[s.cta, !canSave && { opacity: 0.5 }]}>
          <Text style={s.ctaText}>{saving ? 'Saving…' : 'Save ingredients'}</Text>
        </Btn>
      </View>
      <OcrEngine ref={ocr} />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.forest },
  scroll: { padding: 20, gap: 20, paddingBottom: 24 },
  h1: { fontFamily: fonts.display, fontSize: 26, letterSpacing: -0.3, color: colors.forest },
  p: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.muted },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.forest },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  scanBtn: { minHeight: 52, borderRadius: 14, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  scanBtnText: { fontFamily: fonts.bold, fontSize: 15, color: colors.paper },
  scanError: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.coralInk },
  scanNote: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.forest },
  googleBtn: { minHeight: 48, borderRadius: 14, borderWidth: 1.5, borderColor: colors.sandDark, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  googleBtnText: { fontFamily: fonts.bold, fontSize: 15, color: colors.forest },
  textarea: { minHeight: 160, borderRadius: 14, borderWidth: 1.5, borderColor: colors.sandDark, backgroundColor: colors.paper, padding: 16, fontFamily: fonts.medium, fontSize: 15, color: colors.forest, textAlignVertical: 'top' },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.cream, borderTopWidth: 1, borderTopColor: colors.line },
  cta: { minHeight: 56, borderRadius: 16, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: fonts.bold, fontSize: 17, color: colors.paper },
});
