/**
 * Wishlist-specific filter orchestration.
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
  applyMovieDraftFilters,
  applyMusicDraftFilters,
  buildMovieDraftOptions,
  buildMusicFilterOptions,
};

/** movie → kino filter; music/album/klip/konsert → musiqa filter; triller → yo‘q */
export const getFilterPanelKind = (tabId) => {
  if (tabId === 'movie') return 'movie';
  if (
    tabId === 'music' ||
    tabId === 'album' ||
    tabId === 'klip' ||
    tabId === 'konsert'
  ) {
    return 'music';
  }
  return 'none';
};

export const createEmptyDrafts = () => ({
  movie: { ...EMPTY_MOVIE_DRAFT, genres: [] },
  music: { ...EMPTY_MUSIC_DRAFT },
  album: { ...EMPTY_MUSIC_DRAFT },
  klip: { ...EMPTY_MUSIC_DRAFT },
  konsert: { ...EMPTY_MUSIC_DRAFT },
  triller: null,
});

export const cloneDrafts = (drafts) => ({
  movie: {
    ...EMPTY_MOVIE_DRAFT,
    ...drafts?.movie,
    genres: [...(drafts?.movie?.genres || [])],
  },
  music: { ...EMPTY_MUSIC_DRAFT, ...drafts?.music },
  album: { ...EMPTY_MUSIC_DRAFT, ...drafts?.album },
  klip: { ...EMPTY_MUSIC_DRAFT, ...drafts?.klip },
  konsert: { ...EMPTY_MUSIC_DRAFT, ...drafts?.konsert },
  triller: null,
});

export const applyWishlistTabFilters = (tabId, items, drafts) => {
  const kind = getFilterPanelKind(tabId);
  if (kind === 'movie') {
    return applyMovieDraftFilters(items, drafts?.movie || EMPTY_MOVIE_DRAFT, false);
  }
  if (kind === 'music') {
    return applyMusicDraftFilters(items, drafts?.[tabId] || EMPTY_MUSIC_DRAFT);
  }
  return items;
};

export const countWishlistDraftResults = (tabId, catalogs, drafts) => {
  const items = catalogs?.[tabId] || [];
  return applyWishlistTabFilters(tabId, items, drafts).length;
};
