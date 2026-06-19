const STORAGE_KEY = 'violet_shorts_watch_history';

/**
 * Add a short to watch history.
 * @param {Object} short - Short object with { id, filterGenre, filterCountry }
 */
export const addWatch = (short) => {
  if (!short?.id) return;
  const entry = {
    shortId: short.id,
    filterGenre: short.filterGenre || [],
    filterCountry: short.filterCountry || '',
    watchedAt: Date.now(),
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : [];
    history.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('shortsWatchHistory: addWatch failed', e);
  }
};

/**
 * Get full watch history.
 * @returns {Array<{ shortId, filterGenre, filterCountry, watchedAt }>}
 */
export const getWatchHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('shortsWatchHistory: getWatchHistory failed', e);
    return [];
  }
};

/**
 * Clear all watch history.
 */
export const clearHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('shortsWatchHistory: clearHistory failed', e);
  }
};
