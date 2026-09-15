/**
 * Recommended artists carousel API (distinct content-key counts).
 * GET /api/recommended-artists (login)
 * POST /api/recommended-artists/guest (mehmon — localHistory, no DB write)
 */
import { resolveApiBaseUrl } from './apiBase';
import { getListenHistory as getMusicGuestListenHistory } from '../utils/localStorage/guestHistory/musicGuestHistory';

const API_BASE_URL = resolveApiBaseUrl();

const recommendedArtistsFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Recommended artists request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

/**
 * Login only — GET /api/recommended-artists
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<{ artists: Array<{ artistId: string, score: number }>, minScore?: number, source?: string }>}
 */
export const fetchRecommendedArtists = async ({ limit = 40 } = {}) => {
  const query = new URLSearchParams();
  if (limit) query.set('limit', String(limit));

  const res = await recommendedArtistsFetch(
    `/recommended-artists?${query.toString()}`
  );
  const data = await parseJson(res);
  const artists = Array.isArray(data?.artists) ? data.artists : [];

  return {
    artists,
    minScore: data?.minScore,
    limit: data?.limit,
    source: data?.source || (artists.length ? 'artist_watch_score' : 'empty'),
  };
};

/**
 * Guest personalized artists — POST /recommended-artists/guest
 * localHistory bo‘sh → artists=[] (UI trending bilan to‘ldiradi).
 * DB’ga yozilmaydi.
 *
 * @param {Object} [opts]
 * @param {Array<{m,ct,r,t}>} [opts.localHistory]
 * @param {number} [opts.limit]
 * @param {number} [opts.minScore]
 */
export const fetchGuestRecommendedArtists = async ({
  localHistory = [],
  limit = 40,
  minScore,
} = {}) => {
  const history = Array.isArray(localHistory) ? localHistory : [];

  const body = { localHistory: history, limit };
  if (minScore != null) body.minScore = minScore;

  const res = await recommendedArtistsFetch('/recommended-artists/guest', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  const artists = Array.isArray(data?.artists) ? data.artists : [];

  return {
    artists,
    minScore: data?.minScore,
    limit: data?.limit,
    source:
      data?.source ||
      (artists.length ? 'guest_artist_watch_score' : 'guest_empty'),
    userId: data?.userId ?? null,
    creditedContentCount: data?.creditedContentCount,
  };
};

/**
 * Login → GET (mavjud). Guest → POST /guest + violet_guest_music_v1.
 * Login path o‘zgarmaydi.
 *
 * @param {Object} opts
 * @param {boolean} opts.isLoggedIn
 * @param {number} [opts.limit]
 * @param {number} [opts.minScore]
 * @param {Array<{m,ct,r,t}>} [opts.localHistory] — berilmasa guest store o‘qiladi
 */
export const fetchViewerRecommendedArtists = async ({
  isLoggedIn,
  limit = 40,
  minScore,
  localHistory,
} = {}) => {
  if (isLoggedIn) {
    return fetchRecommendedArtists({ limit });
  }

  const history =
    localHistory != null ? localHistory : getMusicGuestListenHistory();

  return fetchGuestRecommendedArtists({
    localHistory: history,
    limit,
    minScore,
  });
};

/**
 * Global trending artists (public): /api/recommended-artists/trending
 * @param {{ limit?: number, windowDays?: number }} [opts]
 * @returns {Promise<{ artists: Array<{ artistId: string, score: number }>, limit?: number, windowDays?: number, source?: string }>}
 */
export const fetchTrendingArtists = async ({ limit = 40, windowDays } = {}) => {
  const query = new URLSearchParams();
  if (limit) query.set('limit', String(limit));
  if (windowDays) query.set('windowDays', String(windowDays));

  const res = await recommendedArtistsFetch(`/recommended-artists/trending?${query.toString()}`);
  const data = await parseJson(res);
  const artists = Array.isArray(data?.artists) ? data.artists : [];

  return {
    artists,
    minScore: data?.minScore,
    limit: data?.limit,
    windowDays: data?.windowDays,
    source: data?.source || (artists.length ? 'artist_watch_credits_trending' : 'empty'),
  };
};

/**
 * Global Top-N artists leaderboard (public): /api/recommended-artists/top
 * @param {{ limit?: number, windowDays?: number }} [opts]
 */
export const fetchTopArtists = async ({ limit = 10, windowDays } = {}) => {
  const query = new URLSearchParams();
  if (limit) query.set('limit', String(limit));
  if (windowDays) query.set('windowDays', String(windowDays));

  const res = await recommendedArtistsFetch(`/recommended-artists/top?${query.toString()}`);
  const data = await parseJson(res);
  const artists = Array.isArray(data?.artists) ? data.artists : [];

  return {
    artists,
    limit: data?.limit,
    windowDays: data?.windowDays,
    source: data?.source || (artists.length ? 'top_artists' : 'empty'),
  };
};

/**
 * Weekly Top-N artists (public): /api/recommended-artists/weekly-top
 * Rolling 7-day window.
 * @param {{ limit?: number, windowDays?: number }} [opts]
 */
export const fetchWeeklyTopArtists = async ({ limit = 10, windowDays } = {}) => {
  const query = new URLSearchParams();
  if (limit) query.set('limit', String(limit));
  if (windowDays) query.set('windowDays', String(windowDays));

  const res = await recommendedArtistsFetch(
    `/recommended-artists/weekly-top?${query.toString()}`
  );
  const data = await parseJson(res);
  const artists = Array.isArray(data?.artists) ? data.artists : [];

  return {
    artists,
    limit: data?.limit,
    windowDays: data?.windowDays,
    source: data?.source || (artists.length ? 'weekly_top_artists' : 'empty'),
  };
};
