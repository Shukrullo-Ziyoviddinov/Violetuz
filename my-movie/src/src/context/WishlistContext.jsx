import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

const WISHLIST_STORAGE_KEY = 'movie_wishlist';

/** id ni saqlash: raqam bo'lsa raqam, string UUID bo'lsa string (backend/database uchun) */
const normalizeId = (id) => {
  if (id == null || id === '') return null;
  const num = parseInt(id, 10);
  return Number.isNaN(num) ? String(id) : num;
};

const migrateFromOldFormat = (parsed) => {
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) =>
    typeof item === 'object' && item?.id != null && item?.type
      ? { id: normalizeId(item.id), type: item.type }
      : { id: normalizeId(item), type: 'movie' }
  );
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const migrated = migrateFromOldFormat(parsed);
        setWishlistItems(migrated);
        if (migrated.some((x) => typeof x === 'object')) {
          localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(migrated));
        }
      }
    } catch (e) {
      setWishlistItems([]);
    }
  }, []);

  const addToWishlist = (id, type = 'movie') => {
    const idVal = normalizeId(id);
    if (idVal == null) return;
    setWishlistItems((prev) => {
      if (prev.some((x) => x.id == idVal && x.type === type)) return prev;
      const next = [...prev, { id: idVal, type }];
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const removeFromWishlist = (id, type) => {
    const idVal = normalizeId(id);
    if (idVal == null) return;
    setWishlistItems((prev) => {
      const next = prev.filter((x) => !(x.id == idVal && x.type === type));
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleWishlist = (id, type = 'movie') => {
    const idVal = normalizeId(id);
    if (idVal == null) return;
    setWishlistItems((prev) => {
      const has = prev.some((x) => x.id == idVal && x.type === type);
      const next = has ? prev.filter((x) => !(x.id == idVal && x.type === type)) : [...prev, { id: idVal, type }];
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const isInWishlist = (id, type = 'movie') =>
    wishlistItems.some((x) => x.id == id && x.type === type);

  const wishlistIds = wishlistItems.filter((x) => x.type === 'movie').map((x) => x.id);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistIds,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return ctx;
};
