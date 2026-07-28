import {
  AUTH_STORAGE_KEY,
  AUTH_TOKEN_KEY,
  PROFILE_STORAGE_KEY,
  loadLegacyUserState,
} from './slices/userUtils';

/**
 * redux-persist — profile + auth token
 */
const userLegacyStorage = {
  getItem() {
    return new Promise((resolve) => {
      try {
        const state = loadLegacyUserState();
        const hasAuth = localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
        const hasToken = !!localStorage.getItem(AUTH_TOKEN_KEY);
        if (!hasAuth || !hasToken) {
          resolve(null);
          return;
        }
        resolve(JSON.stringify(state));
      } catch {
        resolve(null);
      }
    });
  },

  setItem(_key, value) {
    return new Promise((resolve) => {
      try {
        const state = JSON.parse(value);
        const profile = state.profile || {};
        const isLoggedIn = !!state.isLoggedIn;
        const token = state.token || null;

        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        localStorage.setItem(AUTH_STORAGE_KEY, isLoggedIn ? 'true' : 'false');
        if (token) {
          localStorage.setItem(AUTH_TOKEN_KEY, token);
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
      } catch {
        /* ignore */
      }
      resolve();
    });
  },

  removeItem() {
    return new Promise((resolve) => {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      resolve();
    });
  },
};

export default userLegacyStorage;
