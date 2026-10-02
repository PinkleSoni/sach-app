import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addUserProduct } from '../lib/catalog';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Btn, Eyebrow } from '../components/ui';
import Icon from '../components/Icon';
import { colors, fonts } from '../theme';

// Reached when a scan or search comes up empty everywhere — our own
// catalog, Open Beauty Facts, and other Sach users' own submissions.
// Saves a new one, shared with whoever scans or searches for it next.
export default function AddProductScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addRecent } = useApp();
  const [barcode, setBarcode] = useState(route.params?.barcode || '');
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canSave = barcode.trim().replace(/\D/g, '').length >= 6 && name.trim().length > 0;

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError('');
    try {
      const product = await addUserProduct({ barcode, brand, name, category, ingredientsText, uid: user?.uid });
      addRecent(product.id);
      navigation.replace('Result', { productId: product.id });
    } catch {
      setError('Could not save that. Try again.');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.top, { paddingTop: insets.top + 8 }]}>
        <Btn label="Back" onPress={() => navigation.goBack()} style={s.back}><Icon name="back" color={colors.forest} strokeWidth={2.2} /></Btn>
        <Text style={s.topTitle}>Add this product</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6 }}>
          <Eyebrow>Not in our catalog yet</Eyebrow>
          <Text style={s.h1} accessibilityRole="header">Fill in what you know</Text>
          <Text style={s.p}>
            {user?.isDemo
              ? 'Saved on this phone for now — it’ll be shared with everyone once sign-in is fully connected.'
              : 'Shared with anyone who scans or searches for it next — never shown as a browsable list, only as an answer to a scan or search.'}
          </Text>
        </View>

        <Field label="Barcode" value={barcode} onChangeText={setBarcode} placeholder="e.g. 8901030695487" keyboardType="number-pad" />
        <Field label="Brand" value={brand} onChangeText={setBrand} placeholder="e.g. Neel & Co" />
        <Field label="Product name" value={name} onChangeText={setName} placeholder="e.g. Aloe Soothing Gel" />
        <Field label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Moisturiser" />
        <View style={{ gap: 6 }}>
          <Text style={s.label}>Ingredients, if you have them</Text>
          <Text style={s.hint}>One per line, or comma-separated — copy straight off the pack. We'll flag anything you asked us to watch for.</Text>
          <TextInput
            value={ingredientsText}
            onChangeText={setIngredientsText}
            placeholder={'Aqua, Glycerin, Parfum, ...'}
            placeholderTextColor={colors.muted}
            multiline
            style={s.textarea}
          />
        </View>
        {!!error && <Text style={s.error}>{error}</Text>}
      </ScrollView>
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Btn label="Save product" disabled={!canSave || saving} onPress={save} style={[s.cta, (!canSave || saving) && { opacity: 0.5 }]}>
          <Text style={s.ctaText}>{saving ? 'Saving…' : 'Save product'}</Text>
        </Btn>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...inputProps }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} style={s.input} {...inputProps} />
    </View>
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
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: -4 },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1.5, borderColor: colors.sandDark, backgroundColor: colors.paper, paddingHorizontal: 16, fontFamily: fonts.medium, fontSize: 15, color: colors.forest },
  textarea: { minHeight: 100, borderRadius: 14, borderWidth: 1.5, borderColor: colors.sandDark, backgroundColor: colors.paper, padding: 16, fontFamily: fonts.medium, fontSize: 15, color: colors.forest, textAlignVertical: 'top' },
  error: { fontFamily: fonts.regular, fontSize: 13, color: colors.coralInk },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.cream, borderTopWidth: 1, borderTopColor: colors.line },
  cta: { minHeight: 56, borderRadius: 16, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: fonts.bold, fontSize: 17, color: colors.paper },
});
