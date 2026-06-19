import {
  AUTH_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  loadLegacyUserState,
} from './slices/userUtils';

/**
 * redux-persist — `violet_profile` va `violet_user_authenticated` kalitlarini saqlab qoladi
 */
const userLegacyStorage = {
  getItem() {
    return new Promise((resolve) => {
      try {
        const state = loadLegacyUserState();
        const hasProfile = !!localStorage.getItem(PROFILE_STORAGE_KEY);
        const hasAuth = localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
        if (!hasProfile && !hasAuth) {
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

        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        localStorage.setItem(AUTH_STORAGE_KEY, isLoggedIn ? 'true' : 'false');
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
      resolve();
    });
  },
};

export default userLegacyStorage;
