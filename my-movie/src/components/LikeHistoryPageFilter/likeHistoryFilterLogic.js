/**
 * Like-history-specific filter orchestration.
 * Umumiy draft/apply → ../Filters/draftFilterLogic
 */
import {
  EMPTY_MOVIE_DRAFT,
  EMPTY_MUSIC_DRAFT,
  applyMovieDraftFilters,
  applyMusicDraftFilters,
  buildMovieDraftOptions,
  buildMusicFilterOptions,
} from '../Filters/draftFilterLogic';

export {
  EMPTY_MOVIE_DRAFT,
  EMPTY_MUSIC_DRAFT,
  buildMovieDraftOptions,
  buildMusicFilterOptions,
};

export const LIKE_HISTORY_FILTERS = [
  { id: 'movie', labelKey: 'likeHistory.tabMovies', fallback: 'Kinolar' },
  { id: 'clip', labelKey: 'likeHistory.tabClips', fallback: 'Kliplar' },
  { id: 'concert', labelKey: 'likeHistory.tabConcerts', fallback: 'Konsertlar' },
];

/** movie → kino filter; clip/concert → musiqa filter */
export const getLikeHistoryFilterPanelKind = (tabId) => {
  if (tabId === 'movie') return 'movie';
  if (tabId === 'clip' || tabId === 'concert') return 'music';
  return 'none';
};

export const createEmptyLikeHistoryDrafts = () => ({
  movie: { ...EMPTY_MOVIE_DRAFT, genres: [] },
  clip: { ...EMPTY_MUSIC_DRAFT },
  concert: { ...EMPTY_MUSIC_DRAFT },
});

export const cloneLikeHistoryDrafts = (drafts) => ({
  movie: {
    ...EMPTY_MOVIE_DRAFT,
    ...drafts?.movie,
    genres: [...(drafts?.movie?.genres || [])],
  },
  clip: { ...EMPTY_MUSIC_DRAFT, ...drafts?.clip },
  concert: { ...EMPTY_MUSIC_DRAFT, ...drafts?.concert },
});

export const getAvailableLikeHistoryTabs = (items = [], t) => {
  const available = new Set((items || []).map((item) => item.category));
  return LIKE_HISTORY_FILTERS.filter((f) => available.has(f.id)).map((f) => ({
    id: f.id,
    label: typeof t === 'function' ? t(f.labelKey, f.fallback) : f.fallback,
  }));
};

export const pickDefaultLikeHistoryCategory = (items = [], preferred) => {
  const available = new Set((items || []).map((item) => item.category));
  if (preferred && available.has(preferred)) return preferred;
  if (available.has('movie')) return 'movie';
  if (available.has('clip')) return 'clip';
  if (available.has('concert')) return 'concert';
  return preferred || 'movie';
};

export const applyLikeHistoryTabFilters = (tabId, catalogItems, drafts) => {
  const kind = getLikeHistoryFilterPanelKind(tabId);
  if (kind === 'movie') {
    return applyMovieDraftFilters(
      catalogItems,
      drafts?.movie || EMPTY_MOVIE_DRAFT,
      false
    );
  }
  if (kind === 'music') {
    return applyMusicDraftFilters(
      catalogItems,
      drafts?.[tabId] || EMPTY_MUSIC_DRAFT
    );
  }
  return catalogItems;
};

export const countLikeHistoryDraftResults = (tabId, catalogs, drafts) => {
  const items = catalogs?.[tabId] || [];
  return applyLikeHistoryTabFilters(tabId, items, drafts).length;
};

/** History meta → katalog elementlari (filter uchun to‘liq obyektlar) */
export const resolveLikeHistoryCatalogs = ({
  historyItems = [],
  allMovies = [],
  allClips = [],
  allConcerts = [],
}) => {
  const likedMovieIds = new Set(
    historyItems
      .filter((i) => i.category === 'movie')
      .map((i) => String(i.contentId))
  );
  const likedClipIds = new Set(
    historyItems
      .filter((i) => i.category === 'clip')
      .map((i) => String(i.contentId))
  );
  const likedConcertIds = new Set(
    historyItems
      .filter((i) => i.category === 'concert')
      .map((i) => String(i.contentId))
  );

  return {
    movie: (allMovies || []).filter((m) => likedMovieIds.has(String(m.id))),
    clip: (allClips || []).filter((c) => likedClipIds.has(String(c.id))),
    concert: (allConcerts || []).filter((c) =>
      likedConcertIds.has(String(c.id))
    ),
  };
};

/** Katalog filtridan keyin history ro‘yxatini qisqartirish */
export const filterLikeHistoryItems = (
  historyItems,
  category,
  catalogs,
  drafts
) => {
  const catalog = catalogs?.[category] || [];
  const visible = applyLikeHistoryTabFilters(category, catalog, drafts);
  const visibleIds = new Set(visible.map((x) => String(x.id)));
  const catalogIds = new Set(catalog.map((x) => String(x.id)));

  return (historyItems || []).filter((item) => {
    if (item.category !== category) return false;
    const id = String(item.contentId);
    // Katalogda yo‘q — meta bilan ko‘rsatiladi, filter o‘tkazilmaydi
    if (!catalogIds.has(id)) return true;
    return visibleIds.has(id);
  });
};
