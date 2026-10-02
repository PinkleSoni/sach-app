import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProduct } from '../lib/catalog';
import { parseIngredientText, submitIngredients } from '../lib/ingredientSources';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Btn, Eyebrow } from '../components/ui';
import Icon from '../components/Icon';
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
  const count = parseIngredientText(text).length;
  const canSave = count >= 3 && !saving;
  const sharing = !!user && !user.isDemo;

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
  textarea: { minHeight: 160, borderRadius: 14, borderWidth: 1.5, borderColor: colors.sandDark, backgroundColor: colors.paper, padding: 16, fontFamily: fonts.medium, fontSize: 15, color: colors.forest, textAlignVertical: 'top' },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.cream, borderTopWidth: 1, borderTopColor: colors.line },
  cta: { minHeight: 56, borderRadius: 16, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: fonts.bold, fontSize: 17, color: colors.paper },
});
