export const WISHLIST_STORAGE_KEY = 'movie_wishlist';

/** id ni saqlash: raqam bo'lsa raqam, string UUID bo'lsa string (backend/database uchun) */
export const normalizeId = (id) => {
  if (id == null || id === '') return null;
  const num = parseInt(id, 10);
  return Number.isNaN(num) ? String(id) : num;
};

export const migrateFromOldFormat = (parsed) => {
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) =>
    typeof item === 'object' && item?.id != null && item?.type
      ? { id: normalizeId(item.id), type: item.type }
      : { id: normalizeId(item), type: 'movie' }
  );
};
