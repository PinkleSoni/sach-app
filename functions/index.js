const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { SYSTEM_PROMPT, buildUserPrompt, validateResult } = require('./lookup');

initializeApp();
const db = getFirestore();
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

const MODEL = 'claude-sonnet-5-5';
const DAILY_LIMIT_PER_USER = 15;
const MISS_RETRY_DAYS = 7;
const MAX_CONTINUATIONS = 3;

async function callModel(apiKey, input) {
  const messages = [{ role: 'user', content: buildUserPrompt(input) }];
  let content = [];
  for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
    const body = await res.json();
    content = content.concat(body.content || []);
    if (body.stop_reason !== 'pause_turn') return content;
    messages.push({ role: 'assistant', content: body.content });
  }
  return content;
}

// Counts this lookup against the signed-in user's daily allowance.
async function takeAllowance(uid) {
  const day = new Date().toISOString().slice(0, 10);
  const ref = db.collection('lookupUsage').doc(`${uid}_${day}`);
  return db.runTransaction(async (tx) => {
    const used = (await tx.get(ref)).data()?.count || 0;
    if (used >= DAILY_LIMIT_PER_USER) return false;
    tx.set(ref, { uid, day, count: used + 1 });
    return true;
  });
}

exports.lookupIngredients = onCall(
  { region: 'asia-south1', secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 120, memory: '256MiB', maxInstances: 5 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to look up ingredients.');

    const barcode = String(request.data?.barcode || '').replace(/\D/g, '');
    const name = String(request.data?.name || '').trim().slice(0, 200);
    const brand = String(request.data?.brand || '').trim().slice(0, 100);
    if (barcode.length < 6 || barcode.length > 14 || !name) throw new HttpsError('invalid-argument', 'A barcode and product name are required.');

    // Free: someone already found (or typed) a list for this barcode.
    const typed = await db.collection('ingredientLists').doc(barcode).get();
    if (typed.exists) return { status: 'found', text: typed.data().ingredientsText, source: 'user' };
    const cached = await db.collection('webIngredientLists').doc(barcode).get();
    if (cached.exists) {
      const d = cached.data();
      return { status: 'found', text: d.ingredientsText, sourceUrl: d.sourceUrl, sourceTitle: d.sourceTitle };
    }

    // Free: a recent search for this barcode already came up empty.
    const miss = await db.collection('webIngredientMisses').doc(barcode).get();
    const missAt = miss.exists ? miss.data().createdAt?.toMillis?.() : 0;
    if (missAt && Date.now() - missAt < MISS_RETRY_DAYS * 86400000) return { status: 'not_found' };

    if (!(await takeAllowance(request.auth.uid))) return { status: 'rate_limited' };

    let content;
    try {
      content = await callModel(ANTHROPIC_API_KEY.value(), { brand, name, barcode });
    } catch (e) {
      logger.error('lookup failed', { message: e.message });
      throw new HttpsError('unavailable', 'The online lookup is unavailable right now.');
    }

    const result = validateResult(content);
    if (!result.ok) {
      logger.info('no usable list', { barcode, reason: result.reason });
      await db.collection('webIngredientMisses').doc(barcode).set({ barcode, reason: result.reason, createdAt: FieldValue.serverTimestamp() });
      return { status: 'not_found' };
    }

    await db.collection('webIngredientLists').doc(barcode).set({
      barcode,
      ingredientsText: result.text,
      sourceUrl: result.sourceUrl,
      sourceTitle: result.sourceTitle,
      foundBy: request.auth.uid,
      model: MODEL,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { status: 'found', text: result.text, sourceUrl: result.sourceUrl, sourceTitle: result.sourceTitle };
  }
);
