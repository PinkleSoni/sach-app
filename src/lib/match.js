import { AVOID_KEYS, MUST_KEYS } from '../data/catalog';

export const PROFILE_GROUPS = [
  { title: 'Keep these out', items: Object.keys(AVOID_KEYS) },
  { title: 'It must be', items: Object.keys(MUST_KEYS) },
  { title: 'Your skin', items: ['Oily', 'Dry', 'Combination', 'Sensitive', 'Acne-prone'] },
  { title: 'Your hair', items: ['Straight', 'Wavy', 'Curly', 'Colour-treated'] },
];

export const EMPTY_PROFILE = {};

const PASS_AVOID = {
  Fragrance: 'No fragrance', Nuts: 'No nut oils', Parabens: 'No parabens',
  Sulphates: 'No sulphates', 'Drying alcohol': 'No drying alcohol', 'Mineral oil': 'No mineral oil',
};
const PASS_MUST = { Vegan: 'Nothing animal-derived', 'Cruelty-free': 'Not tested on animals', 'Pregnancy-safe': 'Pregnancy-safe formula' };

const SKIN = ['Oily', 'Dry', 'Combination', 'Sensitive', 'Acne-prone'];

// Short label for the "Checking for" pill.
export function profileSummary(profile) {
  const parts = [];
  Object.keys(MUST_KEYS).forEach((k) => profile[k] && parts.push(k));
  Object.keys(AVOID_KEYS).forEach((k) => profile[k] && parts.push('No ' + k.toLowerCase()));
  SKIN.forEach((k) => profile[k] && parts.push(k + ' skin'));
  if (!parts.length) return 'Set your fit';
  const shown = parts.slice(0, 2).join(', ');
  return parts.length > 2 ? `${shown} +${parts.length - 2}` : shown;
}

// Returns { score, verdict, checks, dealbreakers }.
// Hard checks (keep-out and must-be) weigh 2, skin checks weigh 1.
// A failed hard check is a dealbreaker and caps the score below 70.
export function matchProduct(product, profile) {
  const checks = [];

  Object.entries(AVOID_KEYS).forEach(([label, key]) => {
    if (!profile[label]) return;
    const has = !!product.contains[key];
    const ing = product.ingredients.find((i) => i.avoid === key);
    checks.push({
      label: label === 'Fragrance' ? 'Fragrance-free' : `No ${label.toLowerCase()}`,
      item: label,
      pass: !has,
      hard: true,
      detail: has ? `Has ${ing ? ing.name : label.toLowerCase()}` : PASS_AVOID[label],
    });
  });

  Object.entries(MUST_KEYS).forEach(([label, key]) => {
    if (!profile[label]) return;
    const yes = !!product.is[key];
    checks.push({
      label,
      item: label,
      pass: yes,
      hard: true,
      detail: yes ? PASS_MUST[label] : 'Not confirmed',
    });
  });

  SKIN.forEach((label) => {
    if (!profile[label] || !product.skin[label]) return;
    const s = product.skin[label];
    checks.push({ label: `${label} skin`, pass: s.ok, hard: false, detail: s.note });
  });

  const total = checks.reduce((n, c) => n + (c.hard ? 2 : 1), 0);
  const got = checks.reduce((n, c) => n + (c.pass ? (c.hard ? 2 : 1) : 0), 0);
  const dealbreakers = checks.filter((c) => c.hard && !c.pass);
  let score = total ? Math.round((100 * got) / total) : 100;
  if (dealbreakers.length) score = Math.min(score, 69);

  let verdict = 'Good for you';
  if (dealbreakers.length) verdict = 'Not for you';
  else if (score < 85) verdict = 'Mixed fit';

  return { score, verdict, checks, dealbreakers, hasProfile: total > 0 };
}

export function verdictLine(m) {
  if (!m.hasProfile) return 'Set your fit so we can check this against you.';
  if (m.dealbreakers.length) {
    const items = m.dealbreakers.map((d) => d.item);
    const list = items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0];
    const lead = `${list} ${items.length > 1 ? 'are dealbreakers' : 'is a dealbreaker'} for you.`;
    const others = m.checks.filter((c) => !c.pass && !c.hard);
    const tail = others.length ? ` Also check: ${others.map((c) => c.label.toLowerCase()).join(', ')}.` : m.checks.length > m.dealbreakers.length ? ' Everything else fits.' : '';
    return lead + tail;
  }
  const misses = m.checks.filter((c) => !c.pass);
  if (!misses.length) return 'Everything you asked for checks out.';
  return `Mostly fits. Watch out: ${misses.map((c) => c.label.toLowerCase()).join(', ')}.`;
}

// Ingredients worth surfacing: ones you avoid, then ones that help your skin.
export function relevantIngredients(product, profile) {
  const out = [];
  product.ingredients.forEach((ing) => {
    if (ing.avoid) {
      const label = Object.keys(AVOID_KEYS).find((k) => AVOID_KEYS[k] === ing.avoid);
      if (profile[label]) out.push({ name: ing.name, note: 'You asked us to keep this out', tone: 'avoid' });
    } else if (ing.good && ing.good.some((s) => profile[s])) {
      out.push({ name: ing.name, note: ing.note, tone: 'good' });
    }
  });
  return out.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'avoid' ? -1 : 1));
}

// Does a reviewer share your traits? Skin type, hair or a shared avoid list.
export function isLikeMe(review, profile) {
  const mine = Object.keys(profile).filter((k) => profile[k]);
  return review.traits.some((t) => mine.includes(t));
}

const POSITIVE = ['Non-greasy', 'Worth the price', 'Lasts long', 'Good in humidity'];

export function summariseReviews(reviews) {
  if (!reviews.length) return null;
  const counts = {};
  reviews.forEach((r) => r.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
  const chips = Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a])
    .map((t) => ({ label: t, count: counts[t], good: POSITIVE.includes(t) }));
  const avg = reviews.reduce((n, r) => n + r.rating, 0) / reviews.length;
  const pros = chips.filter((c) => c.good).slice(0, 2).map((c) => c.label.toLowerCase());
  const cons = chips.filter((c) => !c.good).slice(0, 2).map((c) => c.label.toLowerCase());
  let text = `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}, ${avg.toFixed(1)}/5 on average.`;
  if (pros.length) text += ` Most mention: ${pros.join(', ')}.`;
  if (cons.length) text += ` Watch for: ${cons.join(', ')}.`;
  return { text, chips: chips.slice(0, 5) };
}

export function durationMonths(text) {
  const m = /(\d+)\s*(week|month)/i.exec(text || '');
  if (!m) return 0;
  return m[2].toLowerCase() === 'week' ? Number(m[1]) / 4.3 : Number(m[1]);
}
