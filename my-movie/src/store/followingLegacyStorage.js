import {
  FOLLOWING_STORAGE_KEY,
  loadLegacyFollowingIds,
} from './slices/followingUtils';

/**
 * redux-persist — `violet_following_artists` kalitini saqlab qoladi
 * (eski format: [artistId, actorId, ...])
 */
const followingLegacyStorage = {
  getItem() {
    return new Promise((resolve) => {
      try {
        const ids = loadLegacyFollowingIds();
        if (ids.length === 0) {
          resolve(null);
          return;
        }
        resolve(JSON.stringify({ ids }));
      } catch {
        resolve(null);
      }
    });
  },

  setItem(_key, value) {
    return new Promise((resolve) => {
      try {
        const state = JSON.parse(value);
        const ids = Array.isArray(state.ids) ? state.ids : [];
        localStorage.setItem(FOLLOWING_STORAGE_KEY, JSON.stringify(ids));
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
