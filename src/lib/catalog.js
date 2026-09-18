import { PRODUCTS } from '../data/catalog';

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

export function getProductByBarcode(code) {
  const clean = String(code || '').replace(/\D/g, '');
  // UPC-A scans arrive as 12 digits; catalog uses EAN-13 (leading 0).
  return PRODUCTS.find((p) => p.barcode === clean || p.barcode === '0' + clean || p.barcode.replace(/^0/, '') === clean) || null;
}

export function searchProducts(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/);
  return PRODUCTS.filter((p) => {
    const hay = `${p.brand} ${p.name} ${p.category}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export function allProducts() {
  return PRODUCTS;
}
