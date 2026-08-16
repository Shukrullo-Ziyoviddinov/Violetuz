import {
  FOLLOWING_STORAGE_KEY,
  loadLegacyFollowingIds,
} from './slices/followingUtils';

/**
 * redux-persist — eski `[id,…]` yoki yangi `{ items: [{id,type}] }`
 */
const followingLegacyStorage = {
  getItem() {
    return new Promise((resolve) => {
      try {
        const raw = localStorage.getItem(FOLLOWING_STORAGE_KEY);
        if (!raw) {
          resolve(null);
          return;
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const items = parsed
            .filter((id) => id != null && id !== '')
            .map((id) => ({ id, type: null }));
          resolve(items.length ? JSON.stringify({ items }) : null);
          return;
        }
        if (parsed && Array.isArray(parsed.items)) {
          resolve(JSON.stringify({ items: parsed.items }));
          return;
        }
        if (parsed && Array.isArray(parsed.ids)) {
          const items = parsed.ids.map((id) => ({ id, type: null }));
          resolve(JSON.stringify({ items }));
          return;
        }
        const ids = loadLegacyFollowingIds();
        resolve(
          ids.length
            ? JSON.stringify({ items: ids.map((id) => ({ id, type: null })) })
            : null
        );
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
        localStorage.setItem(FOLLOWING_STORAGE_KEY, JSON.stringify({ items }));
      } catch {
        /* ignore */
      }
      resolve();
    });
  },

  removeItem() {
    return new Promise((resolve) => {
      localStorage.removeItem(FOLLOWING_STORAGE_KEY);
      resolve();
    });
  },
};

export default followingLegacyStorage;
