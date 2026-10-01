// Open Beauty Facts: a free, open (ODbL-licensed), crowdsourced database of
// real cosmetics products by barcode — https://world.openbeautyfacts.org.
// No API key needed. Used as a fallback when a scanned or searched product
// isn't in our own curated demo catalog (src/data/catalog.js).
//
// What it can and can't tell us:
// - Ingredient lists, so "Keep these out" (fragrance, parabens, ...) checks
//   work on real products via keyword matching below.
// - "Vegan" only when every listed ingredient is explicitly tagged vegan.
// - Nothing on cruelty-free or pregnancy-safe (no reliable signal exists in
//   ingredient data for either) — left unknown, not guessed.
// - Nothing on fit for a given skin type, and no reviews — those are
//   inherently editorial/subjective and only exist for our demo products.
// Coverage is crowdsourced and skews toward European-market products; a
// barcode not being found here doesn't mean the product doesn't exist.

const BASE = 'https://world.openbeautyfacts.org';
const USER_AGENT = 'Sach/1.0 (github.com/PinkleSoni/sach-app)';
const PRODUCT_FIELDS = 'code,product_name,generic_name,brands,categories,ingredients,image_front_small_url';

const AVOID_PATTERNS = {
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
};

function ingredientName(ing) {
  // OBF ingredient text is often the raw label, sometimes shouting case.
  const raw = (ing.text || ing.id || '').replace(/^en:|^fr:/, '').trim();
  if (!raw) return 'Unlisted ingredient';
  return raw.length > 3 ? raw[0].toUpperCase() + raw.slice(1).toLowerCase() : raw.toUpperCase();
}

function matchAvoidKey(ing) {
  const hay = `${ing.text || ''} ${ing.id || ''}`;
  for (const [key, pattern] of Object.entries(AVOID_PATTERNS)) {
    if (pattern.test(hay)) return key;
  }
  return null;
}

// Turns Open Beauty Facts' raw shape into the same product shape
// src/data/catalog.js uses, so the rest of the app can't tell the two apart.
function normalizeProduct(raw) {
  const rawIngredients = Array.isArray(raw.ingredients) ? raw.ingredients : [];
  const ingredients = rawIngredients.slice(0, 40).map((ing) => {
    const avoid = matchAvoidKey(ing);
    return { name: ingredientName(ing), note: avoid ? 'Flagged from the ingredient label' : '', avoid: avoid || undefined };
  });

  const contains = {};
  ingredients.forEach((ing) => { if (ing.avoid) contains[ing.avoid] = true; });

  // Vegan only when every ingredient is explicitly tagged vegan — anything
  // else (including "no data") stays unknown, never guessed as true/false.
  const veganTags = rawIngredients.map((i) => i.vegan).filter(Boolean);
  const is = {};
  if (veganTags.length && veganTags.length === rawIngredients.length) {
    is.vegan = veganTags.every((v) => v === 'yes');
  }
  // crueltyFree and pregnancySafe: intentionally left unset (unknown) —
  // there's no ingredient-level signal for either.

  const brand = (raw.brands || '').split(',')[0].trim() || 'Unknown brand';
  const category = (raw.categories || '').split(',')[0].replace(/^(en|fr):/, '').trim() || 'Personal care';

  return {
    id: `obf:${raw.code}`,
    barcode: raw.code,
    brand,
    name: raw.product_name || raw.generic_name || 'Unnamed product',
    category: category.charAt(0).toUpperCase() + category.slice(1),
    source: 'openbeautyfacts',
    contains,
    is,
    skin: {}, // no fit-for-skin-type data exists for real, uncurated products
    ingredients: ingredients.length ? ingredients : [{ name: 'No ingredient list on file', note: '' }],
  };
}

async function obfFetch(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Open Beauty Facts: HTTP ${res.status}`);
  return res.json();
}

export async function fetchProductByBarcode(barcode) {
  try {
    const json = await obfFetch(`${BASE}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${PRODUCT_FIELDS}`);
    if (json.status !== 1 || !json.product) return null;
    return normalizeProduct({ ...json.product, code: barcode });
  } catch {
    return null; // offline, rate-limited, or the service is down — fail quiet
  }
}

export async function searchProductsByName(query) {
  try {
    const url = `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=true&page_size=8&fields=${PRODUCT_FIELDS}`;
    const json = await obfFetch(url);
    const products = Array.isArray(json.products) ? json.products : [];
    return products
      .filter((p) => p.code && (p.product_name || p.generic_name))
      .map(normalizeProduct);
  } catch {
    return [];
  }
}
