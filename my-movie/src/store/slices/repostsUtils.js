import {
  migrateRepostsList,
  normalizeRepostId,
  normalizeRepostType,
  sanitizeRepostItem,
} from '../../components/Repost/repostTypes';

export const REPOST_STORAGE_KEY = 'violet_reposts';

export const makeRepostKey = (id, type) => `${String(id)}::${String(type || '')}`;

export const loadLegacyReposts = () => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REPOST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const rawList = Array.isArray(parsed) ? parsed : [];
    const { items } = migrateRepostsList(rawList);
    return items;
  } catch {
    return [];
  }
};

export const isRepostedInList = (items, id, type) => {
  const idVal = normalizeRepostId(id);
  const typeVal = normalizeRepostType(type);
  if (idVal == null || !typeVal) return false;
  const key = makeRepostKey(idVal, typeVal);
  return items.some((x) => makeRepostKey(x.id, x.type) === key);
};

export const toggleRepostInList = (items, item) => {
  const sanitized = sanitizeRepostItem(item);
  if (!sanitized) return items;

  const key = makeRepostKey(sanitized.id, sanitized.type);
  const exists = items.some((x) => makeRepostKey(x.id, x.type) === key);

  if (exists) {
    return items.filter((x) => makeRepostKey(x.id, x.type) !== key);
  }

  return [
    {
      ...sanitized,
      createdAt: item?.createdAt || new Date().toISOString(),
    },
    ...items,
  ];
};
