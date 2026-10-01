import { PRODUCTS } from '../data/catalog';
import { fetchProductByBarcode, searchProductsByName } from './openBeautyFacts';

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

// Async: checks our curated catalog first (instant), then falls back to
// Open Beauty Facts for a real product we don't have curated data for.
export async function getProductByBarcode(code) {
  const clean = normalizeBarcode(code);
  const local = findLocalByBarcode(clean);
  if (local) return local;
  const cached = Object.values(fetchedCache).find((p) => normalizeBarcode(p.barcode) === clean);
  if (cached) return cached;
  const remote = await fetchProductByBarcode(clean);
  return rememberFetched(remote);
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
// skin-fit and review data), then real products from Open Beauty Facts for
// anything our own catalog doesn't cover. Only hits the network for a query
// specific enough to be worth it.
export async function searchProducts(query) {
  const local = searchLocal(query);
  const q = String(query || '').trim();
  if (q.length < 3) return local;
  const remote = (await searchProductsByName(q)).map(rememberFetched);
  const seen = new Set(local.map((p) => p.id));
  return [...local, ...remote.filter((p) => !seen.has(p.id))];
}

export function allProducts() {
  return PRODUCTS;
}
