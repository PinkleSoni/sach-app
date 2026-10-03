import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import * as storage from '../lib/storage';
import { hydrateFetchedProducts, allFetchedProducts, getProduct, enrichIngredients, refreshFromOpenBeautyFacts, setProductIngredients } from '../lib/catalog';
import { hasUsableIngredients } from '../lib/match';
import { fetchSharedReviews } from '../lib/sharedReviews';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [recents, setRecents] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [helpful, setHelpful] = useState([]);
  const [remoteReviews, setRemoteReviews] = useState({});
  // Bumped when a cached product changes (e.g. gains an ingredient list) so screens re-read it.
  const [productsVersion, setProductsVersion] = useState(0);

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

  const productChanged = useCallback(() => {
    storage.saveFetchedProducts(allFetchedProducts());
    setProductsVersion((v) => v + 1);
  }, []);

  // Pulls in an ingredient list other people added (or the server found) for a product without one.
  const refreshIngredients = useCallback(async (productId) => {
    let product = getProduct(productId);
    if (!product) return;
    // Open Beauty Facts may have been completed since this was saved.
    const fromObf = await refreshFromOpenBeautyFacts(product);
    product = fromObf.product;
    let changed = fromObf.changed;
    if (!hasUsableIngredients(product)) {
      const updated = await enrichIngredients(product);
      changed = changed || updated !== product;
    }
    if (changed) productChanged();
  }, [productChanged]);

  // found = { source: 'user' | 'web', text, url? }
  const applyIngredientList = useCallback((productId, found) => {
    if (setProductIngredients(productId, found)) productChanged();
  }, [productChanged]);

  const loadRemoteReviews = useCallback((productId) => {
    return fetchSharedReviews(productId)
      .then((list) => setRemoteReviews((prev) => ({ ...prev, [productId]: list })))
      .catch(() => {});
  }, []);

  // Your own review is already in myReviews (with its photos and voice
  // note), so the shared copy of it is left out rather than shown twice.
  const reviewsFor = useCallback(
    (productId) => {
      const mine = new Set(myReviews.map((r) => r.id));
      const shared = (remoteReviews[productId] || []).filter((r) => !mine.has(r.localId));
      return [...myReviews, ...shared].filter((r) => r.productId === productId);
    },
    [myReviews, remoteReviews]
  );

  const value = useMemo(
    () => ({ ready, profile, setProfile, myReviews, recents, addRecent, addReview, wishlist, toggleWishlist, helpful, toggleHelpful, reviewsFor, loadRemoteReviews, refreshIngredients, applyIngredientList, productsVersion }),
    [ready, profile, setProfile, myReviews, recents, addRecent, addReview, wishlist, toggleWishlist, helpful, toggleHelpful, reviewsFor, loadRemoteReviews, refreshIngredients, applyIngredientList, productsVersion]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
