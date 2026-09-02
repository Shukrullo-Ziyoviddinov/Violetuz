export const LIKE_HISTORY_FILTERS = [
  { id: 'movie', labelKey: 'likeHistory.tabMovies', fallback: 'Kinolar' },
  { id: 'clip', labelKey: 'likeHistory.tabClips', fallback: 'Kliplar' },
  { id: 'concert', labelKey: 'likeHistory.tabConcerts', fallback: 'Konsertlar' },
];

export const getAvailableLikeHistoryTabs = (items = [], t) => {
  const available = new Set((items || []).map((item) => item.category));
  return LIKE_HISTORY_FILTERS.filter((f) => available.has(f.id)).map((f) => ({
    id: f.id,
    label: typeof t === 'function' ? t(f.labelKey, f.fallback) : f.fallback,
  }));
};

export const countLikeHistoryByCategory = (items = [], category) =>
  (items || []).filter((item) => item.category === category).length;

export const pickDefaultLikeHistoryCategory = (items = [], preferred) => {
  const available = new Set((items || []).map((item) => item.category));
  if (preferred && available.has(preferred)) return preferred;
  if (available.has('movie')) return 'movie';
  if (available.has('clip')) return 'clip';
  if (available.has('concert')) return 'concert';
  return preferred || 'movie';
};
