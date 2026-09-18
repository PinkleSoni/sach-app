import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  profile: 'sach.profile.v1',
  reviews: 'sach.reviews.v1',
  recents: 'sach.recents.v1',
  wishlist: 'sach.wishlist.v1',
  helpful: 'sach.helpful.v1',
};

async function read(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function write(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable; the in-memory copy still works this session.
  }
}

export const loadAll = async () => ({
  profile: await read(KEYS.profile, null),
  reviews: await read(KEYS.reviews, []),
  recents: await read(KEYS.recents, []),
  wishlist: await read(KEYS.wishlist, []),
  helpful: await read(KEYS.helpful, []),
});

export const saveProfile = (v) => write(KEYS.profile, v);
export const saveReviews = (v) => write(KEYS.reviews, v);
export const saveRecents = (v) => write(KEYS.recents, v);
export const saveWishlist = (v) => write(KEYS.wishlist, v);
export const saveHelpful = (v) => write(KEYS.helpful, v);
