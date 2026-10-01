// Design tokens, rebuilt from a competitor pass (Sep 2026) across five live
// products: Yuka (Poppins/Open Sans, flat red/orange/green traffic-light
// scoring), SkinSort (Inter, stone neutrals, tight-tracked bold display,
// indigo accent), Sephora (Helvetica Neue, pure black-on-white), Nykaa
// (Inter, near-black ink on near-white, pill chips, pink accent), and
// Duolingo (bold rounded sans, softened dark-grey ink, heavy weight
// everywhere). Every one of them is sans-serif on a white or near-white
// ground with one confident accent color — the opposite of the old heavy
// Young Serif + dark-forest look. This file keeps every existing token
// NAME (so screens don't need touching) but gives each one a cleaner,
// flatter, higher-contrast value in that spirit.

export const colors = {
  // Page surfaces: near-white, not beige — matches Yuka/SkinSort/Nykaa.
  cream: '#FAF8F4',
  creamDeep: '#F2EFE8',
  paper: '#FFFFFF',

  // Neutral chip/border scale (a warm "stone", like SkinSort's palette).
  sand: '#EFEDE7',
  sandDark: '#D8D4C9',
  line: '#E7E3DA',
  lineSoft: '#F0EDE6',

  // Ink + dark brand surfaces: a clean near-black with a faint green
  // whisper, not the old muddy forest. Used for text AND dark cards.
  forest: '#171E1B',
  forestMid: '#232E29',
  forestSoft: '#2F3C35',

  // The live camera screen is true neutral charcoal, like a scanner UI
  // (Google Lens, bank check-deposit) rather than a tinted dark green.
  night: '#15181A',
  nightDeep: '#0D0F10',

  // Primary accent: one confident, AA-safe green (CTA bg + link text),
  // in the same family Yuka and WhatsApp use for "good"/"go".
  green: '#15803D',
  greenGood: '#16A34A',
  greenTint: '#DCFCE7',
  greenInk: '#166534',
  greenLight: '#86EFAC',

  // Secondary accent: a flat amber, close to Yuka's sampled orange dot.
  amber: '#F59E0B',
  amberTint: '#FEF3C7',
  amberInk: '#92400E',

  // Semantic "bad"/dealbreaker: a flat red, close to Yuka's sampled dot.
  coral: '#F87171',
  coralDeep: '#DC2626',
  coralInk: '#B91C1C',
  coralTint: '#FEE2E2',
  coralTintInk: '#991B1B',
  coralDark: '#3F0D0D',
  coralLight: '#FCA5A5',

  // Secondary text: true neutral stone, not green-tinted.
  muted: '#78716C',
  mutedDark: '#44403C',
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  // Every competitor researched sets headlines and big numerals in a bold
  // sans, not a display serif — so "display" now points at Inter, not a
  // separate typeface. Kept as its own token because headline/number
  // styles may want to move independently of ui.js's `bold`.
  display: 'Inter_800ExtraBold',
};
