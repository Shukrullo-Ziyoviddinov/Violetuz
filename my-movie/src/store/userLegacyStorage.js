import { PROFILE_STORAGE_KEY, loadLegacyUserState } from './slices/userUtils';

/**
 * redux-persist — faqat profil cache (auth httpOnly cookie’da)
 */
const userLegacyStorage = {
  getItem() {
    return new Promise((resolve) => {
      try {
        const state = loadLegacyUserState();
        resolve(
          JSON.stringify({
            isLoggedIn: false,
            authReady: false,
            profile: state.profile,
          })
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
        const profile = state.profile || {};
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      } catch {
        /* ignore */
      }
      resolve();
    });
  },

  removeItem() {
    return new Promise((resolve) => {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem('violet_auth_token');
      localStorage.removeItem('violet_user_authenticated');
      resolve();
    });
  },
};

export default userLegacyStorage;
