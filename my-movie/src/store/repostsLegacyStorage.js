import { REPOST_STORAGE_KEY, loadLegacyReposts } from './slices/repostsUtils';

/**
 * redux-persist — `violet_reposts` kalitini saqlab qoladi
 * (eski format: [{ id, type, title, image, route, ... }, ...])
 */
const repostsLegacyStorage = {
  getItem() {
    return new Promise((resolve) => {
      try {
        const items = loadLegacyReposts();
        if (items.length === 0) {
          resolve(null);
          return;
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
        localStorage.setItem(REPOST_STORAGE_KEY, JSON.stringify(items));
      } catch {
        /* ignore */
      }
      resolve();
    });
  },

  removeItem() {
    return new Promise((resolve) => {
      localStorage.removeItem(REPOST_STORAGE_KEY);
      resolve();
    });
  },
};

export default repostsLegacyStorage;
