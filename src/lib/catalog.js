import { PRODUCTS } from '../data/catalog';
import { fetchProductByBarcode, searchProductsByName } from './openBeautyFacts';
import { buildUserProduct, fetchUserProductByBarcode, searchUserProducts, submitUserProduct } from './userProducts';

// Products fetched from Open Beauty Facts at runtime, keyed by id, so a
// barcode scan or name search for a real (non-demo) product can be looked
// up again synchronously afterwards — by this screen, by History, by
// Reviews — without re-fetching. Hydrated from AsyncStorage at startup and
// added to as new products are found; see AppContext and lib/storage.js.
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
  return PRODUCTS.find((p) => p.id === id) || fetchedCache[id] || null;
}

function normalizeBarcode(code) {
  return String(code || '').replace(/\D/g, '');
}

function findLocalByBarcode(clean) {
  // UPC-A scans arrive as 12 digits; our own catalog uses EAN-13 (leading 0).
  return PRODUCTS.find((p) => p.barcode === clean || p.barcode === '0' + clean || p.barcode.replace(/^0/, '') === clean) || null;
}

// Async: checks our curated catalog first (instant), then Open Beauty
// Facts, then finally other Sach users' own submissions for a barcode
// nobody else has data on.
export async function getProductByBarcode(code) {
  const clean = normalizeBarcode(code);
  const local = findLocalByBarcode(clean);
  if (local) return local;
  const cached = Object.values(fetchedCache).find((p) => normalizeBarcode(p.barcode) === clean);
  if (cached) return cached;
  const remote = await fetchProductByBarcode(clean);
  if (remote) return rememberFetched(remote);
  const userSubmitted = await fetchUserProductByBarcode(clean);
  return rememberFetched(userSubmitted);
}

function searchLocal(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/);
  return PRODUCTS.filter((p) => {
    const hay = `${p.brand} ${p.name} ${p.category}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

// Async: local matches first (instant, and these have the richer curated
// skin-fit and review data), then real products from Open Beauty Facts,
// then other Sach users' own submissions. Only hits the network for a
// query specific enough to be worth it.
export async function searchProducts(query) {
  const local = searchLocal(query);
  const q = String(query || '').trim();
  if (q.length < 3) return local;
  const [obf, userSubmitted] = await Promise.all([searchProductsByName(q), searchUserProducts(q)]);
  const seen = new Set(local.map((p) => p.id));
  const extra = [];
  // Products people added in Sach come before the (much larger) Open Beauty
  // Facts matches, so a product you just added isn't buried at the bottom.
  for (const p of [...userSubmitted, ...obf].map(rememberFetched)) {
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    extra.push(p);
  }
  return [...local, ...extra];
}

export function allProducts() {
  return PRODUCTS;
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
