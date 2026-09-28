export const WISHLIST_STORAGE_KEY = 'movie_wishlist';

/** id ni saqlash: raqam bo'lsa raqam, string UUID bo'lsa string (backend/database uchun) */
export const normalizeId = (id) => {
  if (id == null || id === '') return null;
  const str = String(id).trim();
  const num = parseInt(str, 10);
  if (Number.isNaN(num) || String(num) !== str) return str;
  return num;
};

export const migrateFromOldFormat = (parsed) => {
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) =>
    typeof item === 'object' && item?.id != null && item?.type
      ? { id: normalizeId(item.id), type: item.type }
      : { id: normalizeId(item), type: 'movie' }
  );
};

export const shortsWishlistType = (item) =>
  item?.type === 'musicshorts' ? 'musicshorts' : 'movieShorts';

export const isShortsWishlistType = (type) => {
  const v = String(type || '').toLowerCase();
  return v === 'shorts' || v === 'movieshorts' || v === 'musicshorts';
};

/** API saveCount viewer ovozini ayirgan; UI o‘z saqlashini qo‘shadi. */
export const displaySaveCount = (base, saved) =>
  Math.max(0, (Number(base) || 0) + (saved ? 1 : 0));
