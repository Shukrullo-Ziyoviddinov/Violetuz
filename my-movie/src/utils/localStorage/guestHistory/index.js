/**
 * Shared guest history core + domain stores.
 * Movie + music stores (separate keys). UI/API wiring is per-domain steps.
 * Mix play counts: alohida key — rec listen history bilan aralashmaydi.
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

export {
  MUSIC_MIX_GUEST_PLAYS_STORAGE_KEY,
  MIX_GUEST_CONTENT_TYPES,
  recordMixPlay as recordGuestMixPlay,
  getMixPlayCounts as getGuestMixPlayCounts,
  clearMixPlayCounts as clearGuestMixPlayCounts,
  musicMixGuestPlayCountsConfig,
  default as musicMixGuestPlayCountsStore,
} from './musicMixGuestPlayCounts';

export {
  assembleMixes as assembleGuestMixes,
  buildGuestMixes,
  getGuestMixes,
} from '../../musicMix/assembleGuestMixes';
