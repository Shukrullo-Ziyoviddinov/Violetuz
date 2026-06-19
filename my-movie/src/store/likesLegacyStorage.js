import {
  LIKE_HISTORY_KEY,
  REACTIONS_KEY,
  SHORTS_LIKES_KEY,
  loadLegacyLikeHistory,
  loadLegacyReactions,
  loadLegacyShortsLikes,
  syncLegacyReactionKeys,
} from './slices/likesUtils';

/**
 * redux-persist — legacy kalitlarni saqlab qoladi:
 * - violet_like_history_v1
 * - violet_like_reactions_v1 (+ eski per-key reactions)
 * - violet_shorts_video_likes
 */
const likesLegacyStorage = {
  getItem() {
    return new Promise((resolve) => {
      try {
        const items = loadLegacyLikeHistory();
        const reactions = loadLegacyReactions();
        const shortsLikedIds = loadLegacyShortsLikes();

        if (items.length === 0 && Object.keys(reactions).length === 0 && shortsLikedIds.length === 0) {
          resolve(null);
          return;
        }

        resolve(JSON.stringify({ items, reactions, shortsLikedIds }));
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
        const reactions =
          state.reactions && typeof state.reactions === 'object' && !Array.isArray(state.reactions)
            ? state.reactions
            : {};
        const shortsLikedIds = Array.isArray(state.shortsLikedIds)
          ? state.shortsLikedIds.map(String)
          : [];

        localStorage.setItem(LIKE_HISTORY_KEY, JSON.stringify(items));
        localStorage.setItem(REACTIONS_KEY, JSON.stringify(reactions));
        localStorage.setItem(SHORTS_LIKES_KEY, JSON.stringify(shortsLikedIds));
        syncLegacyReactionKeys(reactions);
      } catch {
        /* ignore */
      }
      resolve();
    });
  },

  removeItem() {
    return new Promise((resolve) => {
      localStorage.removeItem(LIKE_HISTORY_KEY);
      localStorage.removeItem(REACTIONS_KEY);
      localStorage.removeItem(SHORTS_LIKES_KEY);
      resolve();
    });
  },
};

export default likesLegacyStorage;
