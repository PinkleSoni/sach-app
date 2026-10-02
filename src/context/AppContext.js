import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import * as storage from '../lib/storage';
import { SEED_REVIEWS } from '../data/reviews';
import { hydrateFetchedProducts, allFetchedProducts, getProduct } from '../lib/catalog';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [recents, setRecents] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [helpful, setHelpful] = useState([]);

  useEffect(() => {
    storage.loadAll().then((s) => {
      hydrateFetchedProducts(s.fetchedProducts);
      setProfileState(s.profile);
      setMyReviews(s.reviews);
      setRecents(s.recents);
      setWishlist(s.wishlist);
      setHelpful(s.helpful);
      setReady(true);
    });
  }, []);

  const setProfile = useCallback((p) => {
    setProfileState(p);
    storage.saveProfile(p);
  }, []);

  const addRecent = useCallback((productId) => {
    setRecents((prev) => {
      const next = [productId, ...prev.filter((id) => id !== productId)].slice(0, 20);
      storage.saveRecents(next);
      return next;
    });
    // If this wasn't one of our own curated products (it came from Open
    // Beauty Facts, or a user filled it in by hand), remember it past this
    // session so History and Reviews can still resolve it by id later.
    const source = getProduct(productId)?.source;
    if (source === 'openbeautyfacts' || source === 'user') {
      storage.saveFetchedProducts(allFetchedProducts());
    }
  }, []);

  const addReview = useCallback((review) => {
    setMyReviews((prev) => {
      const next = [review, ...prev];
      storage.saveReviews(next);
      return next;
    });
  }, []);

  const toggleWishlist = useCallback((productId) => {
    setWishlist((prev) => {
      const next = prev.includes(productId) ? prev.filter((id) => id !== productId) : [productId, ...prev];
      storage.saveWishlist(next);
      return next;
    });
  }, []);

  const toggleHelpful = useCallback((reviewId) => {
    setHelpful((prev) => {
      const next = prev.includes(reviewId) ? prev.filter((id) => id !== reviewId) : [...prev, reviewId];
      storage.saveHelpful(next);
      return next;
    });
  }, []);

  const reviewsFor = useCallback(
    (productId) => [...myReviews, ...SEED_REVIEWS].filter((r) => r.productId === productId),
    [myReviews]
  );

  const value = useMemo(
    () => ({ ready, profile, setProfile, myReviews, recents, addRecent, addReview, wishlist, toggleWishlist, helpful, toggleHelpful, reviewsFor }),
    [ready, profile, setProfile, myReviews, recents, addRecent, addReview, wishlist, toggleWishlist, helpful, toggleHelpful, reviewsFor]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
