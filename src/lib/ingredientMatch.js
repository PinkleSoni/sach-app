// Shared ingredient-text -> "Keep these out" key matching. Used by both
// Open Beauty Facts (lib/openBeautyFacts.js) and a user's own typed
// ingredient list (lib/userProducts.js), so a barcode never gets two
// different opinions depending on which source answered it.

export const AVOID_PATTERNS = {
  // Includes the EU's declared standalone fragrance allergens (limonene,
  // linalool, etc.) — when one of these appears alone in a list, it signals
  // an added fragrance compound, the same as "Parfum" itself. Lip products
  // list added scent as "flavor"/"aroma".
  fragrance: /\b(parfum|perfume|fragrance|aroma|flavou?r|limonene|linalool|citronellol|geraniol|eugenol|citral|coumarin|benzyl benzoate|benzyl salicylate|hexyl ?cinnamal|cinnamal|cinnamyl alcohol|anise alcohol|hydroxycitronellal|methylpropional|farnesol|lilial|hydroxyisohexyl)\b|ionone/i,
  // Tree nuts and peanut only. Shea, coconut and argan are not treated as
  // nuts: they're rarely a problem for people with nut allergies, and
  // flagging them would hit a large share of products.
  nuts: /\b(almond|amygdalus|arachis|peanut|hazelnut|corylus|walnut|juglans|cashew|anacardium|pistachio|pistacia|macadamia|brazil nut|bertholletia|pecan)\b/i,
  parabens: /paraben/i,
  // Detergent sulfates only (SLS/SLES and relatives, spelled sulfate or
  // sulphate). Not magnesium/zinc/sodium sulfate or conditioning agents
  // like behentrimonium methosulfate.
  sulphates: /\b(sles|sls)\b|(lauryl|laureth(-\d+)?|coco|myreth|trideceth(-\d+)?|pareth(-\d+)?|cetearyl|alkyl)[ -]*sul(f|ph)ate/i,
  // Ethanol and isopropyl alcohol only. The lookahead excludes fatty
  // alcohols (cetyl, stearyl, ...), benzyl alcohol, phenoxyethanol and
  // aminomethyl propanol, which aren't drying.
  dryingAlcohol: /^(?!.*(cetyl|stearyl|cetearyl|ceteary|behenyl|benzyl|phenethyl|myristyl|lauryl|arachidyl|cinnamyl|anise|lanolin|coconut|coco|isostearyl|oleyl|polyvinyl|phenoxy|aminomethyl|free|cétyl|cétéaryl|stéaryl)).*(\balcohol\b|\balcool\b|\bethanol\b)/i,
  mineralOil: /\b(mineral oil|paraffinum|paraffin|petrolatum|vaseline|ceresin|ozokerite|cera microcristallina|microcrystalline wax|huile min[ée]rale)\b/i,
  essentialOils: /essential oil|huile essentielle|(citrus|lavandula|mentha|eucalyptus|melaleuca|cananga|rosmarinus|cymbopogon|lemongrass|pelargonium|cedrus|juniperus|santalum|sandalwood|rosa damascena|rosa centifolia|jasminum|cinnamomum|syzygium|thymus|origanum|salvia|pogostemon|vetiveria|chrysopogon|boswellia|commiphora|zingiber|pinus|aniba|bulnesia|ocimum|abies|cupressus|ylang|mandarin|lavandin|litsea|thuja).*\boil\b/i,
  // Every silicone ends in -methicone, -siloxane or -silsesquioxane.
  silicones: /methicone|dimethiconol|siloxane|silsesquioxane|silicone/i,
  formaldehydeReleasers: /\b(formaldehyde|paraformaldehyde|dmdm hydantoin|imidazolidinyl urea|diazolidinyl urea|quaternium-15|bronopol|methenamine|benzylhemiformal)\b|hydroxymethylglycinate|2-bromo-2-nitropropane/i,
  // Common Malassezia folliculitis ("fungal acne") feeders: fatty acid esters,
  // free fatty acids and polysorbates. Deliberately excludes fatty ALCOHOLS
  // (cetyl/stearyl alcohol), which despite the similar name are considered
  // fungal-acne-safe.
  fungalAcneTriggers: /\b(isopropyl palmitate|isopropyl myristate|isopropyl linoleate|myristyl myristate|polysorbate\s?20|polysorbate\s?60|polysorbate\s?80|oleic acid|lauric acid|glyceryl stearate|sorbitan oleate)\b/i,
};

// Clearly animal-derived ingredients. This can show a product ISN'T vegan;
// it can never prove one is, since a plain-looking name can still be animal
// sourced, so a product with none of these stays "unknown", not "vegan".
const NON_VEGAN = /\b(beeswax|cera alba|cera flava|honey|mel|lanolin|lanosterol|carmine|cochineal|ci ?75470|collagen|keratin|casein|lactose|whey|lac|shellac|gelatin|silk|serica|royal jelly|propolis|placenta|guanine|pearl|elastin|albumen|egg|ovum|tallow|sevum|lard|adeps|castoreum|ambergris)\b/i;
const PLANT_MILK = /(coconut|almond|oat|soy|rice|cocos|prunus|avena|glycine|oryza|nucifera|hemp|cashew)/i;

export function looksNonVegan(name) {
  // Plants and synthetics whose names contain an animal word.
  const t = String(name || '').replace(/milk thistle|pearl millet|silk tree|silk cotton|honeysuckle|eggplant|synthetic beeswax|zea mays silk|corn silk/gi, '');
  if (NON_VEGAN.test(t)) return true;
  return /\bmilk\b/i.test(t) && !PLANT_MILK.test(t);
}

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
