import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

const COLLECTION = 'reviews';

// Deliberately number-free: the Result screen's "Used the longest" badge
// parses digits out of `duration`, and this is when it was posted, not how
// long they used the product.
function ago(ms) {
  if (!ms) return 'Just posted';
  const days = (Date.now() - ms) / 86400000;
  if (days < 1) return 'Posted today';
  if (days < 7) return 'Posted this week';
  if (days < 31) return 'Posted this month';
  return 'Posted a while ago';
}

// Photos and voice notes are device file paths, so only the text parts of a
// review are shared. Demo users never write to Firestore.
export async function submitSharedReview(review, user) {
  if (!isFirebaseConfigured || !user || user.isDemo) return;
  await addDoc(collection(db, COLLECTION), {
    userId: user.uid,
    localId: review.id,
    productId: review.productId,
    rating: review.rating,
    name: (user.displayName || 'Someone').split(' ')[0],
    traits: review.traits,
    tags: review.tags,
    text: review.text,
    createdAt: serverTimestamp(),
  });
}

export async function fetchSharedReviews(productId) {
  if (!isFirebaseConfigured) return [];
  const snap = await getDocs(query(collection(db, COLLECTION), where('productId', '==', productId)));
  return snap.docs
    .map((d) => {
      const x = d.data();
      const ms = x.createdAt?.toMillis?.() || 0;
      return {
        id: 'r_' + d.id,
        localId: x.localId,
        productId: x.productId,
        rating: x.rating,
        name: x.name || 'Someone',
        traits: x.traits || [],
        duration: ago(ms),
        tags: x.tags || [],
        text: x.text || '',
        _ms: ms,
      };
    })
    .sort((a, b) => b._ms - a._ms);
}
