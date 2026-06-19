/**
 * Shorts Video Likes API - har bir short uchun like (yurakcha)
 * Har bir user faqat bitta videoga bitta like bera oladi (toggle)
 * Qayta bosilsa like olib tashlanadi
 */

const STORAGE_KEY = 'violet_shorts_video_likes';

const getLikedSet = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    }
  } catch (e) {
    console.warn('getLikedSet error:', e);
  }
  return new Set();
};

const saveLikedSet = (set) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch (e) {
    console.warn('saveLikedSet error:', e);
  }
};

/** User usha shortni like qilganmi - 1 yoki 0 */
export const getLikeCount = (shortsId) => {
  return getLikedSet().has(String(shortsId)) ? 1 : 0;
};

/** Toggle: like qilgan bo'lsa olib tashlash, qilmagan bo'lsa qo'shish */
export const toggleShortsLike = (shortsId) => {
  const liked = getLikedSet();
  const idStr = String(shortsId);
  if (liked.has(idStr)) {
    liked.delete(idStr);
    saveLikedSet(liked);
    return 0;
  }
  liked.add(idStr);
  saveLikedSet(liked);
  return 1;
};

export const getLikedShortsIds = () => getLikedSet();
