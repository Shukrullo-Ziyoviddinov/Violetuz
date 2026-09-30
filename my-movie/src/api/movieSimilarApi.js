/**
 * Movie detail "Shunga o'xshash" — GET /movies/:movieId/similar (cache).
 * recommendation / home-feed API lariga ulanmaydi.
 */
import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

/**
 * @param {string|number} movieId
 * @param {{ limit?: number }} [options]
 * @returns {Promise<object[]>}
 */
export const fetchSimilarMovies = async (movieId, options = {}) => {
  const id = movieId == null ? '' : String(movieId).trim();
  if (!id) return [];

  const params = new URLSearchParams();
  const limit = Number(options.limit);
  if (Number.isFinite(limit) && limit > 0) {
    params.set('limit', String(Math.floor(limit)));
  }

  const query = params.toString();
  const url = `${API_BASE_URL}/movies/${encodeURIComponent(id)}/similar${
    query ? `?${query}` : ''
  }`;

  const response = await fetch(url, { credentials: 'include' });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || payload?.success === false) {
    const err = new Error(payload?.message || 'Similar movies request failed');
    err.status = response.status;
    throw err;
  }

  const movies = payload?.data?.movies;
  return Array.isArray(movies) ? movies : [];
};
