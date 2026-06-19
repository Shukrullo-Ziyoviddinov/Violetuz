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
