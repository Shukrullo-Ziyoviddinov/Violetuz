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

const normalizePage = (data) => ({
  movies: Array.isArray(data?.movies) ? data.movies : [],
  hasMore: Boolean(data?.hasMore),
  genres: Array.isArray(data?.genres)
    ? data.genres.map((item) => String(item).trim()).filter(Boolean)
    : [],
  source: data?.source || 'computed',
});

const excludeParam = (excludeIds) =>
  (Array.isArray(excludeIds) ? excludeIds : [])
    .map((id) => String(id).trim())
    .filter(Boolean);

/**
 * Movie detail sahifasi. Home lenta chaqiruvi bu funksiyadan o'tmaydi.
 * offset/limit berilmasa to'liq lenta qaytmaydi — sahifa majburiy.
 */
export const fetchViewerHomeFeedPage = async ({
  isLoggedIn,
  localHistory,
  offset = 0,
  limit = 10,
  excludeIds = [],
  genre = '',
} = {}) => {
  const exclude = excludeParam(excludeIds);
  const selectedGenre = String(genre || '').trim();
  const genreValue = selectedGenre && selectedGenre !== 'all' ? selectedGenre : '';
  if (isLoggedIn) {
    const params = new URLSearchParams();
    params.set('offset', String(Math.max(0, Number(offset) || 0)));
    params.set('limit', String(Math.max(1, Number(limit) || 10)));
    if (exclude.length) params.set('exclude', exclude.join(','));
    if (genreValue) params.set('genre', genreValue);
    const res = await homeFeedFetch(`/home-feed?${params.toString()}`);
    return normalizePage(await parseJson(res));
  }

  const history = localHistory != null ? localHistory : getMovieGuestWatchHistory();
  const res = await homeFeedFetch('/home-feed/guest', {
    method: 'POST',
    body: JSON.stringify({
      localHistory: Array.isArray(history) ? history : [],
      offset: Math.max(0, Number(offset) || 0),
      limit: Math.max(1, Number(limit) || 10),
      exclude,
      ...(genreValue ? { genre: genreValue } : {}),
    }),
  });
  return normalizePage(await parseJson(res));
};
