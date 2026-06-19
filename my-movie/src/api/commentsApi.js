/**
 * Comments API - Backendga mos
 * Hozir localStorage, keyin fetch/axios bilan almashtiriladi
 *
 * Backend endpoint'lari (kelajakda):
 * GET    /api/movies/:movieId/comments
 * POST   /api/movies/:movieId/comments
 * PATCH  /api/movies/:movieId/comments/:commentId/like
 * GET    /api/movies/:movieId/comments/liked
 */

const STORAGE_PREFIX = 'violet_movie_comments_';
const LIKED_PREFIX = 'violet_comment_liked_';

/** Avatarsiz nusxa — localStorage kvota / stringify xatoligida qayta urinish uchun */
const stripAuthorAvatars = (items) => {
  if (!Array.isArray(items)) return items;
  return items.map((c) => ({
    ...c,
    authorAvatar: null,
    replies: c.replies?.length ? stripAuthorAvatars(c.replies) : [],
  }));
};

/** movieId har doim bir xil formatda (aralashmasin) */
export const toMovieKey = (movieId) => String(movieId);

/**
 * @param {string|number} movieId - Kino ID
 * @returns {Array} Kommentlar ro'yxati (faqat shu kinoga tegishli)
 */
export const getComments = (movieId) => {
  try {
    const key = `${STORAGE_PREFIX}${toMovieKey(movieId)}`;
    let stored = localStorage.getItem(key);
    // VideoPage: avvalgi mv_<id> kalitidan bir martalik ko'chirish
    if (!stored && String(movieId).startsWith('music:')) {
      const bare = String(movieId).slice(7);
      const legacyKey = `${STORAGE_PREFIX}mv_${bare}`;
      const legacy = localStorage.getItem(legacyKey);
      if (legacy) {
        try {
          localStorage.setItem(key, legacy);
        } catch (e) {
          console.warn('getComments migrate legacy error:', legacyKey, e);
        }
        stored = legacy;
      }
    }
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.warn('getComments error:', e);
  }
  return [];
};

/**
 * @param {string|number} movieId - Kino ID
 * @param {Array} comments - Yangilangan kommentlar
 */
export const saveComments = (movieId, comments) => {
  const key = `${STORAGE_PREFIX}${toMovieKey(movieId)}`;
  try {
    localStorage.setItem(key, JSON.stringify(comments));
  } catch (e) {
    try {
      localStorage.setItem(key, JSON.stringify(stripAuthorAvatars(comments)));
    } catch (e2) {
      console.warn('saveComments error:', key, e2);
    }
  }
};

/**
 * @param {string|number} movieId - Kino ID
 * @returns {Set<string>} Like qilingan comment ID'lar (faqat shu kinoga)
 */
export const getLikedIds = (movieId) => {
  try {
    const key = `${LIKED_PREFIX}${toMovieKey(movieId)}`;
    let stored = localStorage.getItem(key);
    if (!stored && String(movieId).startsWith('music:')) {
      const bare = String(movieId).slice(7);
      const legacyKey = `${LIKED_PREFIX}mv_${bare}`;
      const legacy = localStorage.getItem(legacyKey);
      if (legacy) {
        try {
          localStorage.setItem(key, legacy);
        } catch (e) {
          console.warn('getLikedIds migrate legacy error:', legacyKey, e);
        }
        stored = legacy;
      }
    }
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(Array.isArray(parsed) ? parsed : []);
    }
  } catch (e) {
    console.warn('getLikedIds error:', e);
  }
  return new Set();
};

/**
 * @param {string|number} movieId - Kino ID
 * @param {Set<string>} likedIds - Yangilangan like ID'lar
 */
export const saveLikedIds = (movieId, likedIds) => {
  const key = `${LIKED_PREFIX}${toMovieKey(movieId)}`;
  try {
    localStorage.setItem(key, JSON.stringify([...likedIds]));
  } catch (e) {
    console.warn('saveLikedIds error:', key, e);
  }
};

const COMMENTS_CHANGED_EVENT = 'violet-movie-comments-changed';

export const dispatchMovieCommentsChanged = (movieId) => {
  try {
    window.dispatchEvent(
      new CustomEvent(COMMENTS_CHANGED_EVENT, { detail: { movieId: toMovieKey(movieId) } })
    );
  } catch (e) {
    /* ignore */
  }
};

function updateCommentTextInTree(list, commentId, newText) {
  return list.map((c) => {
    if (String(c.id) === String(commentId)) {
      return { ...c, text: newText };
    }
    if (c.replies?.length) {
      return { ...c, replies: updateCommentTextInTree(c.replies, commentId, newText) };
    }
    return c;
  });
}

function removeCommentByIdFromTree(list, commentId) {
  return list
    .filter((c) => String(c.id) !== String(commentId))
    .map((c) => ({
      ...c,
      replies: c.replies?.length ? removeCommentByIdFromTree(c.replies, commentId) : [],
    }));
}

/**
 * Kino / klip / konsert — bitta comment matnini yangilash.
 * Hozir: localStorage. Backend: shu nom va parametrlar bilan `fetch` qo‘ying; oxirida `dispatchMovieCommentsChanged` chaqirilsin.
 *
 * @returns {Promise<void>}
 */
export const updateCommentTextById = async (movieId, commentId, newText) => {
  const text = String(newText ?? '').trim();
  if (!text) return;
  const raw = getComments(movieId);
  const updated = updateCommentTextInTree(raw, commentId, text);
  saveComments(movieId, updated);
  dispatchMovieCommentsChanged(movieId);
};

/**
 * Kino / klip / konsert — commentni olib tashlash.
 * Backend ulanganda: DELETE muvaffaqiyatdan keyin local cache + `dispatchMovieCommentsChanged`.
 *
 * @returns {Promise<void>}
 */
export const deleteCommentById = async (movieId, commentId) => {
  const raw = getComments(movieId);
  const updated = removeCommentByIdFromTree(raw, commentId);
  saveComments(movieId, updated);
  const liked = getLikedIds(movieId);
  liked.delete(String(commentId));
  saveLikedIds(movieId, liked);
  dispatchMovieCommentsChanged(movieId);
};

export { COMMENTS_CHANGED_EVENT };
