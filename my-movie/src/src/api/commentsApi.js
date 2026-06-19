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

/** movieId har doim bir xil formatda (aralashmasin) */
export const toMovieKey = (movieId) => String(movieId);

/**
 * @param {string|number} movieId - Kino ID
 * @returns {Array} Kommentlar ro'yxati (faqat shu kinoga tegishli)
 */
export const getComments = (movieId) => {
  try {
    const key = `${STORAGE_PREFIX}${toMovieKey(movieId)}`;
    const stored = localStorage.getItem(key);
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
  try {
    const key = `${STORAGE_PREFIX}${toMovieKey(movieId)}`;
    localStorage.setItem(key, JSON.stringify(comments));
  } catch (e) {
    console.warn('saveComments error:', e);
  }
};

/**
 * @param {string|number} movieId - Kino ID
 * @returns {Set<string>} Like qilingan comment ID'lar (faqat shu kinoga)
 */
export const getLikedIds = (movieId) => {
  try {
    const key = `${LIKED_PREFIX}${toMovieKey(movieId)}`;
    const stored = localStorage.getItem(key);
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
  try {
    const key = `${LIKED_PREFIX}${toMovieKey(movieId)}`;
    localStorage.setItem(key, JSON.stringify([...likedIds]));
  } catch (e) {
    console.warn('saveLikedIds error:', e);
  }
};
