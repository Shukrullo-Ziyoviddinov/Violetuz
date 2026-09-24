/**
 * "Sizga mos musiqalar" lentasi.
 * GET /api/music-home-feed — cookie.
 * POST /api/music-home-feed/guest — localHistory, bazaga yozilmaydi.
 */
import { resolveApiBaseUrl } from './apiBase';
import { getListenHistory } from '../utils/localStorage/guestHistory/musicGuestHistory';

const API_BASE_URL = resolveApiBaseUrl();

const musicHomeFeedFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Music home feed request failed');
    err.status = response.status;
    throw err;
  }
  return body?.data ?? body;
};

export const fetchLoginMusicHomeFeed = async () => {
  const res = await musicHomeFeedFetch('/music-home-feed');
  const data = await parseJson(res);
  return {
    tracks: Array.isArray(data?.tracks) ? data.tracks : [],
    source: data?.source || 'computed',
  };
};

export const fetchGuestMusicHomeFeed = async (localHistory = []) => {
  const res = await musicHomeFeedFetch('/music-home-feed/guest', {
    method: 'POST',
    body: JSON.stringify({
      localHistory: Array.isArray(localHistory) ? localHistory : [],
    }),
  });
  const data = await parseJson(res);
  return {
    tracks: Array.isArray(data?.tracks) ? data.tracks : [],
    source: data?.source || 'guest',
  };
};

export const fetchViewerMusicHomeFeed = async ({ isLoggedIn, localHistory } = {}) => {
  if (isLoggedIn) return fetchLoginMusicHomeFeed();
  const history = localHistory != null ? localHistory : getListenHistory();
  return fetchGuestMusicHomeFeed(history);
};
