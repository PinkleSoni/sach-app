// Turns the raw text OCR reads off a pack into just the ingredient list.
// Packs also carry directions, warnings, addresses and batch codes, and
// OCR splits lines and misreads punctuation, so this finds the list by its
// heading and stops where the next section starts.

const START = /\b(ingredients?|ingr[eé]dients?|composition|inci)\b\s*[:;\-–—.]?\s*/i;
const END = /\b(directions?|how to use|usage|apply|warnings?|caution|precautions?|manufactured|marketed|mfd|mfg|net\s*(wt|weight|qty|quantity|content)|best before|batch|store in|for external use|customer care|made in|distributed|imported|contains\s+\d|date of)\b/i;

export function extractIngredientList(rawText) {
  let t = String(rawText || '')
    .replace(/-\s*\n\s*/g, '') // "Glyc-\nerin" -> "Glycerin"
    .replace(/[|_~•·]/g, ' ')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const start = t.search(START);
  if (start !== -1) {
    const after = t.slice(start).replace(START, '');
    const end = after.search(END);
    t = end === -1 ? after : after.slice(0, end);
  }

  return t
    .replace(/\s+,/g, ',')
    .replace(/,\s*,+/g, ',')
    .replace(/^[\s,.:;-]+|[\s,;:-]+$/g, '')
    .replace(/\.$/, '')
    .trim();
}
