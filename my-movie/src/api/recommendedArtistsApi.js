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
