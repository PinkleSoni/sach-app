// Demo catalog. Brands, products and barcodes are fictional sample data so the
// app is fully usable offline. Swap `getProductByBarcode` / `searchProducts`
// in src/lib/catalog.js for a real product API before public launch.

export const AVOID_KEYS = {
  Fragrance: 'fragrance',
  Nuts: 'nuts',
  Parabens: 'parabens',
  Sulphates: 'sulphates',
  'Drying alcohol': 'dryingAlcohol',
  'Mineral oil': 'mineralOil',
};

export const MUST_KEYS = {
  Vegan: 'vegan',
  'Cruelty-free': 'crueltyFree',
  'Pregnancy-safe': 'pregnancySafe',
};

// contains: which "keep these out" items the product has.
// is: which "must be" claims it meets.
// skin: how it sits with each skin type. ok = fits, note = short reason.
export const PRODUCTS = [
  {
    id: 'kesar-ceramide-gel',
    barcode: '8900000000011',
    brand: 'Neel & Co',
    name: 'Kesar Ceramide Gel Moisturiser',
    category: 'Moisturiser',
    contains: { fragrance: true },
    is: { vegan: true, crueltyFree: true, pregnancySafe: true },
    skin: {
      Oily: { ok: true, note: 'Light gel texture' },
      Dry: { ok: false, note: 'Not rich enough in winter' },
      Combination: { ok: true, note: 'Balanced, non-greasy finish' },
      Sensitive: { ok: false, note: 'Fragrance can irritate' },
      'Acne-prone': { ok: true, note: 'Non-comedogenic gel' },
    },
    ingredients: [
      { name: 'Aqua', note: 'Base' },
      { name: 'Glycerin', note: 'Draws in moisture' },
      { name: 'Niacinamide', note: 'Helps control oil', good: ['Oily', 'Acne-prone', 'Combination'] },
      { name: 'Ceramide NP', note: 'Supports your skin barrier', good: ['Dry', 'Sensitive', 'Oily', 'Combination', 'Acne-prone'] },
      { name: 'Crocus Sativus Extract', note: 'Saffron extract' },
      { name: 'Squalane', note: 'Lightweight emollient' },
      { name: 'Carbomer', note: 'Gel texture' },
      { name: 'Sodium Hyaluronate', note: 'Hydration', good: ['Dry', 'Combination'] },
      { name: 'Parfum', note: 'Fragrance', avoid: 'fragrance' },
      { name: 'Phenoxyethanol', note: 'Preservative' },
    ],
  },
  {
    id: 'haldi-barrier-cream',
    barcode: '8900000000028',
    brand: 'Neel & Co',
    name: 'Haldi Barrier Cream, Fragrance-free',
    category: 'Moisturiser',
    contains: {},
    is: { vegan: true, crueltyFree: true, pregnancySafe: true },
    skin: {
      Oily: { ok: true, note: 'Light gel-cream, no shine' },
      Dry: { ok: true, note: 'Rich enough for dry days' },
      Combination: { ok: true, note: 'Balanced' },
      Sensitive: { ok: true, note: 'No fragrance or dyes' },
      'Acne-prone': { ok: true, note: 'Non-comedogenic' },
    },
    ingredients: [
      { name: 'Aqua', note: 'Base' },
      { name: 'Glycerin', note: 'Draws in moisture' },
      { name: 'Niacinamide', note: 'Helps control oil', good: ['Oily', 'Acne-prone', 'Combination'] },
      { name: 'Ceramide NP', note: 'Supports your skin barrier', good: ['Dry', 'Sensitive', 'Oily', 'Combination', 'Acne-prone'] },
      { name: 'Panthenol', note: 'Soothes', good: ['Sensitive', 'Dry'] },
      { name: 'Squalane', note: 'Lightweight emollient' },
      { name: 'Carbomer', note: 'Texture' },
      { name: 'Phenoxyethanol', note: 'Preservative' },
    ],
  },
  {
    id: 'tulsi-oil-free-gel',
    barcode: '8900000000035',
    brand: 'Kaveri Botanics',
    name: 'Tulsi Oil-free Gel Cream',
    category: 'Moisturiser',
    contains: {},
    is: { vegan: true, crueltyFree: true, pregnancySafe: false },
    skin: {
      Oily: { ok: true, note: 'Oil-free, matte finish' },
      Dry: { ok: false, note: 'Too light for dry skin' },
      Combination: { ok: true, note: 'Good on the T-zone' },
      Sensitive: { ok: true, note: 'Fragrance-free' },
      'Acne-prone': { ok: true, note: 'Oil-free' },
    },
    ingredients: [
      { name: 'Aqua', note: 'Base' },
      { name: 'Glycerin', note: 'Draws in moisture' },
      { name: 'Niacinamide', note: 'Helps control oil', good: ['Oily', 'Acne-prone', 'Combination'] },
      { name: 'Salicylic Acid', note: 'Not advised in pregnancy' },
      { name: 'Ocimum Sanctum Extract', note: 'Holy basil' },
      { name: 'Carbomer', note: 'Gel texture' },
    ],
  },
  {
    id: 'amla-shine-hair-oil',
    barcode: '8900000000042',
    brand: 'Kaveri Botanics',
    name: 'Amla Shine Hair Oil',
    category: 'Hair oil',
    contains: { mineralOil: true, fragrance: true },
    is: { vegan: true, crueltyFree: false, pregnancySafe: true },
    skin: {},
    ingredients: [
      { name: 'Paraffinum Liquidum', note: 'Mineral oil', avoid: 'mineralOil' },
      { name: 'Emblica Officinalis Fruit Extract', note: 'Amla' },
      { name: 'Cocos Nucifera Oil', note: 'Coconut oil' },
      { name: 'Parfum', note: 'Fragrance', avoid: 'fragrance' },
    ],
  },
  {
    id: 'bhringraj-scalp-serum',
    barcode: '8900000000059',
    brand: 'Kaveri Botanics',
    name: 'Bhringraj Scalp Serum',
    category: 'Hair serum',
    contains: {},
    is: { vegan: true, crueltyFree: true, pregnancySafe: true },
    skin: {},
    ingredients: [
      { name: 'Aqua', note: 'Base' },
      { name: 'Eclipta Prostrata Extract', note: 'Bhringraj' },
      { name: 'Glycerin', note: 'Draws in moisture' },
      { name: 'Panthenol', note: 'Conditions' },
    ],
  },
  {
    id: 'rose-clay-cleanser',
    barcode: '8900000000066',
    brand: 'Neel & Co',
    name: 'Rose Clay Gel Cleanser',
    category: 'Cleanser',
    contains: { sulphates: true, fragrance: true },
    is: { vegan: true, crueltyFree: true, pregnancySafe: true },
    skin: {
      Oily: { ok: true, note: 'Clay lifts excess oil' },
      Dry: { ok: false, note: 'Can feel stripping' },
      Combination: { ok: true, note: 'Good on the T-zone' },
      Sensitive: { ok: false, note: 'Sulphates and fragrance' },
      'Acne-prone': { ok: true, note: 'Clears pores' },
    },
    ingredients: [
      { name: 'Aqua', note: 'Base' },
      { name: 'Sodium Lauryl Sulfate', note: 'Strong cleanser', avoid: 'sulphates' },
      { name: 'Kaolin', note: 'Clay', good: ['Oily', 'Acne-prone'] },
      { name: 'Rosa Damascena Water', note: 'Rose water' },
      { name: 'Parfum', note: 'Fragrance', avoid: 'fragrance' },
    ],
  },
];
