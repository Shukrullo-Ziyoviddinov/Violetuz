import {
  WISHLIST_STORAGE_KEY,
  migrateFromOldFormat,
} from './slices/wishlistUtils';

/**
 * redux-persist uchun maxsus storage — `movie_wishlist` kalitini saqlab qoladi
 * (eski Context formati bilan mos: [{ id, type }, ...])
 */
const wishlistLegacyStorage = {
  getItem() {
    return new Promise((resolve) => {
      try {
        const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
        if (!raw) {
          resolve(null);
          return;
        }
        const parsed = JSON.parse(raw);
        let items;
        if (Array.isArray(parsed)) {
          items = migrateFromOldFormat(parsed);
        } else if (parsed && Array.isArray(parsed.items)) {
          items = migrateFromOldFormat(parsed.items);
        } else {
          items = [];
        }
        resolve(JSON.stringify({ items }));
      } catch {
        resolve(null);
      }
    });
  },

  setItem(_key, value) {
    return new Promise((resolve) => {
      try {
        const state = JSON.parse(value);
        const items = Array.isArray(state.items) ? state.items : [];
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
      } catch {
        /* ignore */
      }
      resolve();
    });
  },

  removeItem() {
    return new Promise((resolve) => {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
      resolve();
    });
  },
};

export default wishlistLegacyStorage;
