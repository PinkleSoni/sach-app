import { fetchProductByBarcode, searchProductsByName } from './openBeautyFacts';
import { buildUserProduct, fetchUserProductByBarcode, searchUserProducts, submitUserProduct } from './userProducts';
import { applyIngredients, fetchSharedIngredients, normalizeBarcode } from './ingredientSources';
import { hasUsableIngredients } from './match';

// Every product this phone has found (from Open Beauty Facts or another
// Sach user), keyed by id, so it can be looked up again synchronously — by
// Result, History, Reviews — without re-fetching. Hydrated from AsyncStorage
// at startup and added to as new products are found; see AppContext and
// lib/storage.js.
let fetchedCache = {};

export function hydrateFetchedProducts(products) {
  fetchedCache = Object.fromEntries((products || []).map((p) => [p.id, p]));
}

function rememberFetched(product) {
  if (!product) return product;
  fetchedCache = { ...fetchedCache, [product.id]: product };
  return product;
}

export function allFetchedProducts() {
  return Object.values(fetchedCache);
}

// Always synchronous: every screen that renders a product by id (Result,
// Review, History, Reviews) depends on that, including plain
// `recents.map(getProduct)` call sites.
export function getProduct(id) {
  return fetchedCache[id] || null;
}

// Fills in a missing ingredient list from what other people have added (or
// the server found online) for the same barcode.
export async function enrichIngredients(product) {
  if (!product || hasUsableIngredients(product) || !product.barcode) return product;
  const found = await fetchSharedIngredients(normalizeBarcode(product.barcode));
  return found ? rememberFetched(applyIngredients(product, found)) : product;
}

// Applies a list directly (typed by the user, or found online) to a product
// this phone already knows about.
export function setProductIngredients(productId, found) {
  const product = fetchedCache[productId];
  return product ? rememberFetched(applyIngredients(product, found)) : null;
}

// Async: this phone's own history first (instant), then Open Beauty Facts,
// then finally other Sach users' own submissions for a barcode nobody else
// has data on.
export async function getProductByBarcode(code) {
  const clean = normalizeBarcode(code);
  const cached = Object.values(fetchedCache).find((p) => normalizeBarcode(p.barcode) === clean);
  if (cached) return cached;
  const remote = await fetchProductByBarcode(clean);
  if (remote) return rememberFetched(await enrichIngredients(remote));
  const userSubmitted = await fetchUserProductByBarcode(clean);
  return rememberFetched(userSubmitted);
}

// Open Beauty Facts allows 10 searches a minute per IP and says not to use
// search for as-you-type: "you would be blocked very quickly". So products
// already on this phone and shared Sach products update on every keystroke
// (free), while Open Beauty Facts is only asked after a pause in typing,
// at most OBF_BUDGET times a minute, and each query is remembered.
const OBF_PAUSE_MS = 500;
const OBF_BUDGET = 8;
const OBF_WINDOW_MS = 60000;
let obfCalls = [];
const obfCache = new Map();

function obfBudgetLeft() {
  const now = Date.now();
  obfCalls = obfCalls.filter((t) => now - t < OBF_WINDOW_MS);
  return OBF_BUDGET - obfCalls.length;
}

function matchesWords(product, words) {
  const hay = `${product.brand} ${product.name} ${product.category}`.toLowerCase();
  return words.every((w) => hay.includes(w));
}

// Names and brands that start with what was typed come first; otherwise
// the original order (this phone, then shared, then Open Beauty Facts) holds.
function rank(items, q) {
  const ql = q.toLowerCase();
  const score = (p) => (p.name.toLowerCase().startsWith(ql) ? 3 : 0) + (p.brand.toLowerCase().startsWith(ql) ? 2 : 0) + (p.name.toLowerCase().includes(ql) ? 1 : 0);
  return items
    .map((p, i) => [p, i])
    .sort((a, b) => score(b[0]) - score(a[0]) || a[1] - b[1])
    .map((x) => x[0]);
}

function uniqueById(items) {
  const seen = new Set();
  const out = [];
  for (const p of items) {
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

// Calls onUpdate(items, { pending, busy }) as results arrive: first what we
// have locally, then Open Beauty Facts. `pending` means more may still come;
// `busy` means Open Beauty Facts is being rate-limited.
export async function searchProducts(query, { onUpdate, isCancelled = () => false, force = false } = {}) {
  const q = String(query || '').trim();
  if (q.length < 2) return;
  const words = q.toLowerCase().split(/\s+/);
  const emit = (items, info) => {
    if (!isCancelled()) onUpdate?.(rank(uniqueById(items), q), info);
  };

  const known = Object.values(fetchedCache).filter((p) => matchesWords(p, words));
  const shared = (await searchUserProducts(q)).map(rememberFetched);
  if (isCancelled()) return;
  const local = [...known, ...shared];
  const worthAsking = q.length >= 3;
  emit(local, { pending: worthAsking, busy: false });
  if (!worthAsking) return;

  const key = q.toLowerCase();
  let obf = obfCache.get(key);
  let busy = false;
  if (!obf) {
    if (!force) await new Promise((resolve) => setTimeout(resolve, OBF_PAUSE_MS));
    if (isCancelled()) return;
    if (obfBudgetLeft() <= 0) {
      busy = true;
    } else {
      obfCalls.push(Date.now());
      const res = await searchProductsByName(q);
      if (isCancelled()) return;
      busy = res.busy;
      if (!res.busy) {
        obf = res.items.map(rememberFetched);
        obfCache.set(key, obf);
        if (obfCache.size > 30) obfCache.delete(obfCache.keys().next().value);
      }
    }
  }
  const all = [...local, ...(obf || [])];
  emit(all, { pending: false, busy });

  // Products with no ingredient list may have one from other people by now.
  const filled = await Promise.all(all.map(enrichIngredients));
  if (filled.some((p, i) => p !== all[i])) emit(filled, { pending: false, busy });
}

// Every product this phone has looked up so far, used for "better for you"
// suggestions on the Result screen.
export function allProducts() {
  return Object.values(fetchedCache);
}

// Saves a product someone fills in by hand after a scan/search came up
// empty everywhere else. Always remembered locally (so it works this
// session even without Firebase); also shared to Firestore when a real
// project is connected, via submitUserProduct's own configured-check.
export async function addUserProduct(formValues) {
  const product = buildUserProduct(formValues);
  rememberFetched(product);
  await submitUserProduct(product).catch(() => {});
  return product;
}
