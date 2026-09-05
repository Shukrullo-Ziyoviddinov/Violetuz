/**
 * Music category recommendations API.
 * Faqat Music Home sectionlari (categoryNameMusic × contentType) uchun.
 * SimilarSongs / RecommendedClips / AlbumsForYou — ulanmaydi.
 */
import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const musicRecFetch = (path, options = {}) =>
  fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

const parseJson = async (response) => {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok || body?.success === false) {
    const err = new Error(body?.message || 'Music recommendations request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

/**
 * Personalized list for a categoryNameMusic section.
 *
 * @param {Object} opts
 * @param {string} opts.category — categoryNameMusic
 * @param {string} [opts.contentType] — music|album|clip|concert (scoped cache)
 * @param {number} [opts.limit]
 * @param {boolean} [opts.hydrate]
 * @param {boolean} [opts.lazy]
 * @returns {Promise<{ items: Array, itemsHydrated: Array, source?: string, queuedRefresh?: boolean }>}
 */
export const fetchMusicCategoryRecommendations = async ({
  category,
  contentType,
  limit = 120,
  hydrate = true,
  lazy = false,
} = {}) => {
  const categoryKey = String(category || '').trim();
  if (!categoryKey) {
    throw new Error('categoryNameMusic is required');
  }

  const query = new URLSearchParams();
  if (limit) query.set('limit', String(limit));
  if (hydrate === false) query.set('hydrate', 'false');
  if (lazy) query.set('lazy', '1');
  const typeKey = String(contentType || '').trim();
  if (typeKey) query.set('contentType', typeKey);

  const res = await musicRecFetch(
    `/music-recommendations/${encodeURIComponent(categoryKey)}?${query.toString()}`
  );
  const data = await parseJson(res);
  const itemsHydrated = Array.isArray(data?.itemsHydrated) ? data.itemsHydrated : [];

  return {
    itemsHydrated,
    items: Array.isArray(data?.items) ? data.items : [],
    source: data?.source,
    category: data?.category || data?.categoryNameMusic || categoryKey,
    contentType: data?.contentType || typeKey || null,
    generatedAt: data?.generatedAt || null,
    queuedRefresh: Boolean(data?.queuedRefresh),
  };
};

/**
 * Listen progress upsert (≥10s → tinglandi + affinity).
 * POST /api/music-recommendations/progress
 */
export const reportMusicProgress = async ({
  contentType,
  contentId,
  listenedSeconds,
  completionRate,
  durationSec,
  category,
  trackId,
  trackListenedSeconds,
  albumDurationSec,
} = {}) => {
  const res = await musicRecFetch('/music-recommendations/progress', {
    method: 'POST',
    body: JSON.stringify({
      contentType,
      contentId,
      id: contentId,
      listenedSeconds,
      completionRate,
      durationSec,
      category,
      categoryNameMusic: category,
      trackId,
      albumSongId: trackId,
      trackListenedSeconds,
      albumDurationSec,
    }),
  });
  return parseJson(res);
};

/** Defaults — server scoringWeights.progress (music) bilan sync. */
export const DEFAULT_MUSIC_PROGRESS_CONFIG = Object.freeze({
  minListenedSeconds: 10,
  shortCompleteRatio: 0.8,
  affinityMinDelta: 0.1,
  likeEnabledTypes: Object.freeze(['clip', 'concert']),
});

/**
 * GET /api/music-recommendations/config/progress
 */
export const fetchMusicProgressConfig = async () => {
  const res = await musicRecFetch('/music-recommendations/config/progress');
  const data = await parseJson(res);
  return {
    minListenedSeconds:
      Number(data?.minListenedSeconds) || DEFAULT_MUSIC_PROGRESS_CONFIG.minListenedSeconds,
    shortCompleteRatio:
      Number(data?.shortCompleteRatio) || DEFAULT_MUSIC_PROGRESS_CONFIG.shortCompleteRatio,
    affinityMinDelta:
      Number(data?.affinityMinDelta) || DEFAULT_MUSIC_PROGRESS_CONFIG.affinityMinDelta,
    likeEnabledTypes: Array.isArray(data?.likeEnabledTypes)
      ? data.likeEnabledTypes
      : [...DEFAULT_MUSIC_PROGRESS_CONFIG.likeEnabledTypes],
  };
};

/** wishlistType / reaction type → engine contentType */
export const wishlistTypeToContentType = (wishlistType) => {
  const raw = String(wishlistType || '')
    .trim()
    .toLowerCase();
  if (raw === 'klip' || raw === 'clip') return 'clip';
  if (raw === 'konsert' || raw === 'concert') return 'concert';
  if (raw === 'album' || raw === 'musicalbom') return 'album';
  if (raw === 'music') return 'music';
  return '';
};
