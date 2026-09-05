/**
 * Shared listen-progress reporter for music audio + clip/concert video.
 * Threshold: ≥10s (server music engine) — not movie 5 min.
 *
 * Album: per-track seconds; server sums for total minutes / completion.
 */

import {
  reportMusicProgress,
  fetchMusicProgressConfig,
  DEFAULT_MUSIC_PROGRESS_CONFIG,
} from '../api/musicRecommendationsApi';

const PROGRESS_REPORT_INTERVAL_MS = 30_000;

/**
 * Imperative reporter (Context / player ichida refs bilan).
 */
export function createMusicListenProgressReporter() {
  const progressConfigRef = { current: { ...DEFAULT_MUSIC_PROGRESS_CONFIG } };
  const contentKeyRef = { current: null };
  const accumulatedSecRef = { current: 0 };
  const lastTickWallRef = { current: null };
  const lastReportedCompletionRef = { current: null };
  const lastReportAtRef = { current: 0 };
  const progressInFlightRef = { current: false };
  const markedRef = { current: false };

  const loadConfig = async () => {
    try {
      const cfg = await fetchMusicProgressConfig();
      if (cfg) progressConfigRef.current = cfg;
    } catch {
      /* DEFAULT_MUSIC_PROGRESS_CONFIG */
    }
  };

  const reset = (contentType, contentId, { restoreAccumulated = 0 } = {}) => {
    const key =
      contentType != null && contentId != null && contentId !== ''
        ? `${contentType}:${contentId}`
        : null;
    contentKeyRef.current = key;
    accumulatedSecRef.current = Math.max(0, Number(restoreAccumulated) || 0);
    lastTickWallRef.current = null;
    lastReportedCompletionRef.current = null;
    lastReportAtRef.current = 0;
    progressInFlightRef.current = false;
    markedRef.current = false;
  };

  const setAccumulated = (seconds) => {
    accumulatedSecRef.current = Math.max(0, Number(seconds) || 0);
  };

  const isEligible = (listened, dur) => {
    const { minListenedSeconds, shortCompleteRatio } = progressConfigRef.current;
    if (listened >= minListenedSeconds) return true;
    return (
      Number.isFinite(dur) &&
      dur > 0 &&
      dur < minListenedSeconds &&
      listened >= dur * shortCompleteRatio
    );
  };

  const buildCompletionRate = (listened, dur) => {
    if (!Number.isFinite(dur) || dur <= 0) return 0;
    return Math.min(1, Math.max(0, listened / dur));
  };

  const accumulate = ({ isPlaying, playbackRate = 1 } = {}) => {
    if (!isPlaying) {
      lastTickWallRef.current = null;
      return;
    }

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (lastTickWallRef.current != null) {
      const wallDeltaSec = (now - lastTickWallRef.current) / 1000;
      if (wallDeltaSec > 0 && wallDeltaSec < 2.5) {
        const rate = Number(playbackRate) || 1;
        accumulatedSecRef.current += wallDeltaSec * Math.max(0.25, rate);
      }
    }
    lastTickWallRef.current = now;
  };

  /**
   * @param {Object} opts
   * @param {boolean} [opts.force]
   * @param {boolean} [opts.isLoggedIn]
   * @param {string} opts.contentType
   * @param {string|number} opts.contentId
   * @param {string} [opts.category]
   * @param {number} [opts.durationSec]
   * @param {string|number} [opts.trackId] — album song.id
   * @param {number} [opts.trackListenedSeconds]
   * @param {number} [opts.albumDurationSec]
   * @param {boolean} [opts.albumAlreadyOpen] — albom allaqachon 10s+ ochilgan
   */
  const sync = async ({
    force = false,
    isLoggedIn = false,
    contentType,
    contentId,
    category,
    durationSec,
    trackId,
    trackListenedSeconds,
    albumDurationSec,
    albumAlreadyOpen = false,
  } = {}) => {
    if (!contentType || contentId === undefined || contentId === null || contentId === '') {
      return;
    }
    if (progressInFlightRef.current) return;

    const isAlbum = contentType === 'album';
    const listened = isAlbum
      ? Math.max(
          accumulatedSecRef.current,
          Number(trackListenedSeconds) || 0
        )
      : accumulatedSecRef.current;
    const dur = durationSec;

    const eligible =
      isEligible(listened, dur) ||
      (isAlbum && albumAlreadyOpen && listened > 0);

    if (!eligible) return;

    if (!isLoggedIn) {
      markedRef.current = true;
      return;
    }

    const cat = String(category || '').trim();
    if (!cat) return;

    const { affinityMinDelta } = progressConfigRef.current;
    const completionRate = buildCompletionRate(listened, dur);
    const lastC = lastReportedCompletionRef.current;
    const now = Date.now();
    const raisedEnough =
      lastC == null || completionRate >= lastC + affinityMinDelta - 1e-9;
    const intervalOk =
      lastC != null &&
      completionRate > lastC + 1e-9 &&
      now - lastReportAtRef.current >= PROGRESS_REPORT_INTERVAL_MS;

    if (!force && !raisedEnough && !intervalOk && markedRef.current) return;

    progressInFlightRef.current = true;
    lastReportedCompletionRef.current = completionRate;
    lastReportAtRef.current = now;
    markedRef.current = true;

    try {
      await reportMusicProgress({
        contentType,
        contentId,
        listenedSeconds: listened,
        completionRate,
        durationSec: Number.isFinite(dur) && dur > 0 ? dur : undefined,
        category: cat,
        trackId: trackId != null ? trackId : undefined,
        trackListenedSeconds: isAlbum ? listened : undefined,
        albumDurationSec:
          isAlbum && Number.isFinite(albumDurationSec) && albumDurationSec > 0
            ? albumDurationSec
            : undefined,
      });
    } catch {
      lastReportedCompletionRef.current = lastC;
      lastReportAtRef.current = 0;
      if (lastC == null) markedRef.current = false;
    } finally {
      progressInFlightRef.current = false;
    }
  };

  return {
    loadConfig,
    reset,
    setAccumulated,
    accumulate,
    sync,
    getAccumulated: () => accumulatedSecRef.current,
  };
}

/**
 * Resolve engine target from audio player track.
 * Albom ichidagi istalgan trek → album:{albumId} + trackId (song.id).
 *
 * @param {Object|null} track
 * @param {number} [albumTrackIdOffset=50000]
 */
export function resolveAudioListenTarget(track, albumTrackIdOffset = 50000) {
  if (!track || track.id == null) return null;

  const albumId = track.albumId;
  const numericId = Number(track.id);
  const isAlbumTrack =
    albumId != null &&
    albumId !== '' &&
    (track.contentType === 'album' ||
      track.albumSongId != null ||
      (Number.isFinite(numericId) && numericId >= albumTrackIdOffset));

  if (isAlbumTrack) {
    return {
      contentType: 'album',
      contentId: albumId,
      trackId: track.albumSongId != null ? track.albumSongId : track.id,
      category: String(track.categoryNameMusic || '').trim(),
    };
  }

  return {
    contentType: 'music',
    contentId: track.id,
    category: String(track.categoryNameMusic || '').trim(),
  };
}
