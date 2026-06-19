/**
 * Backend/database bilan ishlashda xavfsizlik uchun yordamchi funksiyalar.
 * Ma'lumot API yoki DB dan kelganda null/undefined xatoliklarini oldini oladi.
 */

/** Massiv bo'lmagan qiymatni bo'sh massivga aylantiradi */
export const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);

/** id ni raqam yoki string uchun solishtirish (backend string UUID qaytarsa ham ishlaydi) */
export const matchId = (itemId, targetId) => itemId == targetId || String(itemId) === String(targetId);
