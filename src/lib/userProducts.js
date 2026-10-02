// Products a Sach user fills in by hand when a scan or search comes up
// empty everywhere else (our own catalog, Open Beauty Facts). Shared with
// everyone — the next person who scans or searches for the same thing
// sees it too — but never browsable as a list: it only ever surfaces as
// an answer to a specific scan or search, same as Open Beauty Facts does.
//
// Needs a real Firebase project (see src/lib/firebase.js) to actually be
// shared. Without one, submitting still works, but stays on this device
// only — src/lib/catalog.js folds it into the same local cache a fetched
// Open Beauty Facts product uses.
import { collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { buildIngredients } from './ingredientMatch';

const COLLECTION = 'userProducts';
// One submission per barcode (doc id = barcode): resubmitting the same
// barcode overwrites rather than creating a duplicate entry, which keeps
// things simple at the cost of losing an earlier contributor's version.
const MAX_LISTED = 500; // search fetches at most this many to filter client-side

function normalizeBarcode(code) {
  return String(code || '').replace(/\D/g, '');
}

// Shared by both the Firestore path and the local-only fallback, so a
// submission looks the same regardless of whether it ended up shared.
export function buildUserProduct({ barcode, brand, name, category, ingredientsText, uid }) {
  const clean = normalizeBarcode(barcode);
  const names = (ingredientsText || '').split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  const { ingredients, contains } = buildIngredients(names);
  return {
    id: `user:${clean}`,
    barcode: clean,
    brand: (brand || '').trim() || 'Unknown brand',
    name: (name || '').trim() || 'Unnamed product',
    category: (category || '').trim() || 'Personal care',
    source: 'user',
    submittedBy: uid || null,
    contains,
    is: {}, // vegan/cruelty-free/pregnancy-safe: not asked for in this short form, stays unknown
    skin: {},
    ingredients: ingredients.length ? ingredients : [{ name: 'No ingredients listed', note: '' }],
  };
}

// Writes to Firestore when a real project is connected; the local-only
// fallback (storing it in the normal fetched-product cache) is handled by
// the caller in src/lib/catalog.js, which already does that for every
// product source — this function only needs to handle the shared half.
export async function submitUserProduct(product) {
  if (!isFirebaseConfigured) return;
  await setDoc(doc(db, COLLECTION, product.barcode), {
    ...product,
    nameLower: product.name.toLowerCase(),
    brandLower: product.brand.toLowerCase(),
    createdAt: serverTimestamp(),
  });
}

export async function fetchUserProductByBarcode(barcode) {
  if (!isFirebaseConfigured) return null;
  try {
    const clean = normalizeBarcode(barcode);
    const snap = await getDoc(doc(db, COLLECTION, clean));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

// Firestore has no substring search, and this collection is expected to
// stay small (a personal/demo-scale app's worth of user contributions),
// so this fetches a capped batch and filters the same way the local demo
// catalog does, rather than reaching for a dedicated search service.
export async function searchUserProducts(q) {
  if (!isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(MAX_LISTED)));
    const words = q.toLowerCase().trim().split(/\s+/);
    return snap.docs
      .map((d) => d.data())
      .filter((p) => {
        const hay = `${p.brand} ${p.name} ${p.category}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      });
  } catch {
    return [];
  }
}
