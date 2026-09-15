/**
 * Recommended artists carousel API (distinct content-key counts).
 * GET /api/recommended-artists
 */
import { resolveApiBaseUrl } from './apiBase';

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
