import { fetchProductByBarcode, searchProductsByName } from './openBeautyFacts';
import { buildUserProduct, fetchUserProductByBarcode, searchUserProducts, submitUserProduct } from './userProducts';

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

function normalizeBarcode(code) {
  return String(code || '').replace(/\D/g, '');
}

// Async: this phone's own history first (instant), then Open Beauty Facts,
// then finally other Sach users' own submissions for a barcode nobody else
// has data on.
export async function getProductByBarcode(code) {
  const clean = normalizeBarcode(code);
  const cached = Object.values(fetchedCache).find((p) => normalizeBarcode(p.barcode) === clean);
  if (cached) return cached;
  const remote = await fetchProductByBarcode(clean);
  if (remote) return rememberFetched(remote);
  const userSubmitted = await fetchUserProductByBarcode(clean);
  return rememberFetched(userSubmitted);
}

// Async: other Sach users' submissions, then Open Beauty Facts. Only hits
// the network for a query specific enough to be worth it.
export async function searchProducts(query) {
  const q = String(query || '').trim();
  if (q.length < 3) return [];
  const [obf, userSubmitted] = await Promise.all([searchProductsByName(q), searchUserProducts(q)]);
  const seen = new Set();
  const extra = [];
  // Products people added in Sach come before the (much larger) Open Beauty
  // Facts matches, so a product you just added isn't buried at the bottom.
  for (const p of [...userSubmitted, ...obf].map(rememberFetched)) {
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    extra.push(p);
  }
  return extra;
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
