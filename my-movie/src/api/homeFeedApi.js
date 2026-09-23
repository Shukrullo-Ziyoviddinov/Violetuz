/**
 * "Siz uchun" lentasi.
 * GET /api/home-feed — cookie.
 * POST /api/home-feed/guest — localHistory, bazaga yozilmaydi.
 */
import { resolveApiBaseUrl } from './apiBase';
import { getWatchHistory as getMovieGuestWatchHistory } from '../utils/localStorage/guestHistory/movieGuestHistory';

const API_BASE_URL = resolveApiBaseUrl();

const homeFeedFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Home feed request failed');
    err.status = response.status;
    throw err;
  }
  return body?.data ?? body;
};

export const fetchLoginHomeFeed = async () => {
  const res = await homeFeedFetch('/home-feed');
  const data = await parseJson(res);
  return {
    movies: Array.isArray(data?.movies) ? data.movies : [],
    source: data?.source || 'computed',
  };
};

export const fetchGuestHomeFeed = async (localHistory = []) => {
  const res = await homeFeedFetch('/home-feed/guest', {
    method: 'POST',
    body: JSON.stringify({
      localHistory: Array.isArray(localHistory) ? localHistory : [],
    }),
  });
  const data = await parseJson(res);
  return {
    movies: Array.isArray(data?.movies) ? data.movies : [],
    source: data?.source || 'guest',
  };
};

export const fetchViewerHomeFeed = async ({ isLoggedIn, localHistory } = {}) => {
  if (isLoggedIn) return fetchLoginHomeFeed();
  const history = localHistory != null ? localHistory : getMovieGuestWatchHistory();
  return fetchGuestHomeFeed(history);
};
