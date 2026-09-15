/**
 * Shared guest history core + domain stores.
 * Movie + music stores (separate keys). UI/API wiring is per-domain steps.
 */

export {
  DEFAULT_GUEST_HISTORY_CONFIG,
  MS_PER_DAY,
} from './config';

export { createGuestHistoryStore } from './createGuestHistoryStore';

export {
  MOVIE_GUEST_HISTORY_STORAGE_KEY,
  addWatchEvent as addMovieWatchEvent,
  getWatchHistory as getMovieWatchHistory,
  clearWatchHistory as clearMovieWatchHistory,
  getDecayWeight as getMovieDecayWeight,
  movieGuestHistoryConfig,
  default as movieGuestHistoryStore,
} from './movieGuestHistory';

export {
  MUSIC_GUEST_HISTORY_STORAGE_KEY,
  MUSIC_GUEST_CONTENT_TYPES,
  addListenEvent as addMusicListenEvent,
  getListenHistory as getMusicListenHistory,
  clearListenHistory as clearMusicListenHistory,
  getDecayWeight as getMusicDecayWeight,
  musicGuestHistoryConfig,
  default as musicGuestHistoryStore,
} from './musicGuestHistory';
