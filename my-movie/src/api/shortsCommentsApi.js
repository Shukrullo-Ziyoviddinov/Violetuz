/**
 * Shorts Comments API - shorts uchun alohida storage
 * Har bir short id orqali ajratiladi, filmlar bilan aralashmaydi
 */

const STORAGE_PREFIX = 'violet_shorts_comments_';
const LIKED_PREFIX = 'violet_shorts_comment_liked_';

export const toShortsKey = (shortsId) => String(shortsId);

export const getComments = (shortsId) => {
  try {
    const key = `${STORAGE_PREFIX}${toShortsKey(shortsId)}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.warn('getComments shorts error:', e);
  }
  return [];
};

export const saveComments = (shortsId, comments) => {
  try {
    const key = `${STORAGE_PREFIX}${toShortsKey(shortsId)}`;
    localStorage.setItem(key, JSON.stringify(comments));
  } catch (e) {
    console.warn('saveComments shorts error:', e);
  }
};

export const getLikedIds = (shortsId) => {
  try {
    const key = `${LIKED_PREFIX}${toShortsKey(shortsId)}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(Array.isArray(parsed) ? parsed : []);
    }
  } catch (e) {
    console.warn('getLikedIds shorts error:', e);
  }
  return new Set();
};

export const saveLikedIds = (shortsId, likedIds) => {
  try {
    const key = `${LIKED_PREFIX}${toShortsKey(shortsId)}`;
    localStorage.setItem(key, JSON.stringify([...likedIds]));
  } catch (e) {
    console.warn('saveLikedIds shorts error:', e);
  }
};

const SHORTS_COMMENTS_CHANGED_EVENT = 'violet-shorts-comments-changed';

export const dispatchShortsCommentsChanged = (shortsId) => {
  try {
    window.dispatchEvent(
      new CustomEvent(SHORTS_COMMENTS_CHANGED_EVENT, { detail: { shortsId: toShortsKey(shortsId) } })
    );
  } catch (e) {
    /* ignore */
  }
};

function updateShortsCommentTextInTree(list, commentId, newText) {
  return list.map((c) => {
    if (String(c.id) === String(commentId)) {
      return { ...c, text: newText };
    }
    if (c.replies?.length) {
      return { ...c, replies: updateShortsCommentTextInTree(c.replies, commentId, newText) };
    }
    return c;
  });
}

function removeShortsCommentByIdFromTree(list, commentId) {
  return list
    .filter((c) => String(c.id) !== String(commentId))
    .map((c) => ({
      ...c,
      replies: c.replies?.length ? removeShortsCommentByIdFromTree(c.replies, commentId) : [],
    }));
}

/**
 * Shorts — matnni yangilash. Backend: shu imzo bilan `fetch`, oxirida `dispatchShortsCommentsChanged`.
 * @returns {Promise<void>}
 */
export const updateCommentTextById = async (shortsId, commentId, newText) => {
  const text = String(newText ?? '').trim();
  if (!text) return;
  const raw = getComments(shortsId);
  const updated = updateShortsCommentTextInTree(raw, commentId, text);
  saveComments(shortsId, updated);
  dispatchShortsCommentsChanged(shortsId);
};

/**
 * Shorts — o‘chirish. Backend: DELETE dan keyin cache + `dispatchShortsCommentsChanged`.
 * @returns {Promise<void>}
 */
export const deleteCommentById = async (shortsId, commentId) => {
  const raw = getComments(shortsId);
  const updated = removeShortsCommentByIdFromTree(raw, commentId);
  saveComments(shortsId, updated);
  const liked = getLikedIds(shortsId);
  liked.delete(String(commentId));
  saveLikedIds(shortsId, liked);
  dispatchShortsCommentsChanged(shortsId);
};

export { SHORTS_COMMENTS_CHANGED_EVENT };
