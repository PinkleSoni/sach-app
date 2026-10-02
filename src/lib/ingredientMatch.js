// Shared ingredient-text -> "Keep these out" key matching. Used by both
// Open Beauty Facts (lib/openBeautyFacts.js) and a user's own typed
// ingredient list (lib/userProducts.js), so a barcode never gets two
// different opinions depending on which source answered it.

export const AVOID_PATTERNS = {
  // Includes the EU's declared standalone fragrance allergens (limonene,
  // linalool, etc.) — when one of these appears alone in a list, it signals
  // an added fragrance compound, the same as "Parfum" itself.
  fragrance: /\b(parfum|fragrance|aroma|limonene|linalool|citronellol|geraniol|eugenol|citral|coumarin|benzyl benzoate|benzyl salicylate|hexyl cinnamal)\b/i,
  nuts: /\b(almond|amygdalus|arachis|peanut|hazelnut|walnut|cashew|pistachio)\b/i,
  parabens: /paraben/i,
  sulphates: /\b(sodium laureth sulfate|sodium lauryl sulfate|sles|sls|ammonium laureth sulfate)\b/i,
  dryingAlcohol: /\b(alcohol denat|denatured alcohol|ethanol)\b/i,
  mineralOil: /\b(mineral oil|paraffinum liquidum|petrolatum)\b/i,
  essentialOils: /essential oil|huile essentielle|(citrus|lavandula|mentha|eucalyptus|melaleuca|cananga|rosmarinus).*\boil\b/i,
  silicones: /\b(dimethicone|cyclopentasiloxane|cyclohexasiloxane|amodimethicone|phenyl trimethicone)\b/i,
  formaldehydeReleasers: /\b(dmdm hydantoin|imidazolidinyl urea|diazolidinyl urea|quaternium-15|bronopol)\b/i,
  // Common Malassezia folliculitis ("fungal acne") feeders: fatty acid esters,
  // free fatty acids and polysorbates. Deliberately excludes fatty ALCOHOLS
  // (cetyl/stearyl alcohol), which despite the similar name are considered
  // fungal-acne-safe.
  fungalAcneTriggers: /\b(isopropyl palmitate|isopropyl myristate|isopropyl linoleate|myristyl myristate|polysorbate\s?20|polysorbate\s?60|polysorbate\s?80|oleic acid|lauric acid|glyceryl stearate|sorbitan oleate)\b/i,
};

export function matchAvoidKeyInText(text) {
  for (const [key, pattern] of Object.entries(AVOID_PATTERNS)) {
    if (pattern.test(text)) return key;
  }
  return null;
}

export function titleCase(raw) {
  const t = (raw || '').trim();
  if (!t) return '';
  return t.length > 3 ? t[0].toUpperCase() + t.slice(1).toLowerCase() : t.toUpperCase();
}

// Builds a product's `ingredients` array + derived `contains` map from a
// flat list of ingredient name strings — shared by the OBF normalizer and
// a user's own typed, comma/newline-separated ingredient list.
export function buildIngredients(names) {
  const ingredients = names.filter(Boolean).map((raw) => {
    const avoid = matchAvoidKeyInText(raw);
    return { name: titleCase(raw), note: avoid ? 'Flagged from the ingredient label' : '', avoid: avoid || undefined };
  });
  const contains = {};
  ingredients.forEach((ing) => { if (ing.avoid) contains[ing.avoid] = true; });
  return { ingredients, contains };
}
