import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db, isFirebaseConfigured } from './firebase';
import { buildIngredients, looksNonVegan } from './ingredientMatch';

// Set to true once the lookupIngredients function is deployed (see
// functions/README.md). Until then the "Find them online" button stays hidden.
export const WEB_LOOKUP_ENABLED = false;

const FUNCTIONS_REGION = 'asia-south1';

export function normalizeBarcode(code) {
  return String(code || '').replace(/\D/g, '');
}

// A Google search a person can run themselves to find the pack's ingredient
// list, then paste it into the add-ingredients screen. Costs nothing.
export function googleSearchUrl(product) {
  const brand = product.brand && product.brand !== 'Unknown brand' ? product.brand : '';
  return `https://www.google.com/search?q=${encodeURIComponent(`${brand} ${product.name} ingredients`.trim())}`;
}

export function parseIngredientText(text) {
  return String(text || '')
    .replace(/^\s*ingredients?\s*[:\-]?\s*/i, '')
    .split(/[\n,;•]/)
    .map((s) => s.replace(/^[\s*·-]+/, '').replace(/[\s.]+$/, '').trim())
    .filter(Boolean)
    .slice(0, 80);
}

// Returns a copy of `product` with the ingredient list filled in. `found` is
// { source: 'user' | 'web', text, url?, title? }.
export function applyIngredients(product, found) {
  const names = parseIngredientText(found.text);
  const { ingredients, contains } = buildIngredients(names);
  if (!ingredients.length) return product;
  return {
    ...product,
    ingredients,
    contains,
    ingredientsKnown: true,
    ingredientsSource: found.source,
    ingredientsSourceUrl: found.url || null,
    // Typed from the pack by a person is trusted; found online is not.
    ingredientsUnverified: found.source === 'web',
    is: names.some(looksNonVegan) ? { ...product.is, vegan: false } : product.is,
  };
}

// A list a Sach user typed from the pack wins over one found online.
export async function fetchSharedIngredients(barcode) {
  if (!isFirebaseConfigured || !barcode) return null;
  try {
    const typed = await getDoc(doc(db, 'ingredientLists', barcode));
    if (typed.exists()) return { source: 'user', text: typed.data().ingredientsText };
    const web = await getDoc(doc(db, 'webIngredientLists', barcode));
    if (web.exists()) {
      const d = web.data();
      return { source: 'web', text: d.ingredientsText, url: d.sourceUrl, title: d.sourceTitle };
    }
  } catch {
    // offline or blocked: the product just stays without a list
  }
  return null;
}

export async function submitIngredients(barcode, text, user) {
  if (!isFirebaseConfigured || !user || user.isDemo || !barcode) return;
  await setDoc(doc(db, 'ingredientLists', barcode), {
    barcode,
    ingredientsText: String(text).trim().slice(0, 5000),
    submittedBy: user.uid,
    createdAt: serverTimestamp(),
  });
}

// Asks the server to search the web for this product's ingredient list.
// Resolves to { status: 'found' | 'not_found' | 'rate_limited', ... }.
export async function lookupOnline(product) {
  const call = httpsCallable(getFunctions(app, FUNCTIONS_REGION), 'lookupIngredients');
  const res = await call({ barcode: normalizeBarcode(product.barcode), name: product.name, brand: product.brand });
  return res.data;
}
