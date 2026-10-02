// Open Beauty Facts: a free, open (ODbL-licensed), crowdsourced database of
// real cosmetics products by barcode — https://world.openbeautyfacts.org.
// No API key needed. The main source of product data for scans and searches.
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

import { looksNonVegan, matchAvoidKeyInText, titleCase } from './ingredientMatch';

const BASE = 'https://world.openbeautyfacts.org';
const USER_AGENT = 'Sach/1.0 (github.com/PinkleSoni/sach-app)';
const PRODUCT_FIELDS = 'code,product_name,generic_name,brands,categories,ingredients,ingredients_text,image_front_small_url';

function ingredientName(ing) {
  // OBF ingredient text is often the raw label, sometimes shouting case.
  const raw = (ing.text || ing.id || '').replace(/^en:|^fr:/, '').trim();
  return raw ? titleCase(raw) : 'Unlisted ingredient';
}

function matchAvoidKey(ing) {
  return matchAvoidKeyInText(`${ing.text || ''} ${ing.id || ''}`);
}

// Turns Open Beauty Facts' raw shape into the product shape the rest of the
// app uses, the same one a user-submitted product is built into.
function normalizeProduct(raw) {
  let rawIngredients = Array.isArray(raw.ingredients) ? raw.ingredients : [];
  // Occasionally the label text exists but OBF hasn't parsed it into a list.
  if (!rawIngredients.length && (raw.ingredients_text || '').trim()) {
    rawIngredients = raw.ingredients_text.split(/[,;\n]/).map((t) => ({ text: t.trim() })).filter((i) => i.text);
  }
  const ingredients = rawIngredients.slice(0, 40).map((ing) => {
    const avoid = matchAvoidKey(ing);
    return { name: ingredientName(ing), note: avoid ? 'Flagged from the ingredient label' : '', avoid: avoid || undefined };
  });

  const contains = {};
  ingredients.forEach((ing) => { if (ing.avoid) contains[ing.avoid] = true; });

  // Vegan only when every ingredient is explicitly tagged vegan — anything
  // else (including "no data") stays unknown, never guessed as true/false.
  // One known non-vegan ingredient is enough to say it isn't vegan, from
  // either Open Beauty Facts' own tag or our own name check.
  const veganTags = rawIngredients.map((i) => i.vegan);
  const is = {};
  if (veganTags.some((v) => v === 'no') || rawIngredients.some((i) => looksNonVegan(i.text || i.id))) {
    is.vegan = false;
  } else if (veganTags.length && veganTags.every((v) => v === 'yes' || v === 'en:yes')) {
    is.vegan = true;
  }
  // crueltyFree and pregnancySafe: intentionally left unset (unknown) —
  // there's no ingredient-level signal for either.

  const brand = (raw.brands || '').split(',')[0].trim() || 'Unknown brand';
  const firstCategory = (raw.categories || '').split(',')[0].replace(/^(en|fr):/, '').trim();
  const category = /incorrect|unknown|non-food/i.test(firstCategory) ? 'Personal care' : firstCategory || 'Personal care';

  return {
    id: `obf:${raw.code}`,
    barcode: raw.code,
    brand,
    name: raw.product_name || raw.generic_name || 'Unnamed product',
    category: category.charAt(0).toUpperCase() + category.slice(1),
    source: 'openbeautyfacts',
    image: raw.image_front_small_url || null,
    contains,
    is,
    skin: {}, // no fit-for-skin-type data exists for real, uncurated products
    // About half of Open Beauty Facts products have no ingredient list, and
    // lists of 1-2 items are nearly always OCR junk ("50g", "many"). That
    // means unknown, not clean, so matching skips the keep-out checks.
    ingredientsKnown: ingredients.length >= 3,
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
