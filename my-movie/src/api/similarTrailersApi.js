import { resolveApiBaseUrl } from './apiBase';
import { getWatchHistory as getMovieGuestWatchHistory } from '../utils/localStorage/guestHistory/movieGuestHistory';

const API_BASE_URL = resolveApiBaseUrl();

const isSimilarTrailer = (item) =>
  item &&
  typeof item === 'object' &&
  item.movieId != null &&
  item.id != null &&
  item.trailers;

const normalizeSimilarTrailers = (payload) => {
  const list = Array.isArray(payload?.data) ? payload.data : [];
  return list.filter(isSimilarTrailer);
};

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Similar trailers API error: ${res.status}`);
  }
  return res.json();
};

export const fetchLoginSimilarTrailers = async () => {
  const data = await fetchJson(`${API_BASE_URL}/similar-trailers`);
  return normalizeSimilarTrailers(data);
};

export const fetchGuestSimilarTrailers = async ({ localHistory } = {}) => {
  const history = localHistory != null ? localHistory : getMovieGuestWatchHistory();
  const data = await fetchJson(`${API_BASE_URL}/similar-trailers/guest`, {
    method: 'POST',
    body: JSON.stringify({
      localHistory: Array.isArray(history) ? history : [],
    }),
  });
  return normalizeSimilarTrailers(data);
};

/**
 * Hisob: GET, cookie. Mehmon: POST local tarix. Local hisobga yozilmaydi.
 * @param {{ isLoggedIn?: boolean, localHistory?: unknown }} [opts]
 */
export const fetchSimilarTrailers = async ({ isLoggedIn = false, localHistory } = {}) => {
  if (isLoggedIn) return fetchLoginSimilarTrailers();
  return fetchGuestSimilarTrailers({ localHistory });
};
