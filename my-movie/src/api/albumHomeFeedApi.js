/**
 * "Siz uchun albomlar" lentasi.
 * GET /api/album-home-feed — cookie.
 * POST /api/album-home-feed/guest — localHistory, bazaga yozilmaydi.
 * music-home-feed klientiga ulanmaydi.
 */
import { resolveApiBaseUrl } from './apiBase';
import { getListenHistory } from '../utils/localStorage/guestHistory/musicGuestHistory';

const API_BASE_URL = resolveApiBaseUrl();

const albumRows = (localHistory) =>
  (Array.isArray(localHistory) ? localHistory : []).filter((row) => row?.ct === 'album');

const albumHomeFeedFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Album home feed request failed');
    err.status = response.status;
    throw err;
  }
  return body?.data ?? body;
};

export const fetchLoginAlbumHomeFeed = async () => {
  const res = await albumHomeFeedFetch('/album-home-feed');
  const data = await parseJson(res);
  return {
    albums: Array.isArray(data?.albums) ? data.albums : [],
    source: data?.source || 'computed',
  };
};

export const fetchGuestAlbumHomeFeed = async (localHistory = []) => {
  const res = await albumHomeFeedFetch('/album-home-feed/guest', {
    method: 'POST',
    body: JSON.stringify({
      localHistory: albumRows(localHistory),
    }),
  });
  const data = await parseJson(res);
  return {
    albums: Array.isArray(data?.albums) ? data.albums : [],
    source: data?.source || 'guest',
  };
};

export const fetchViewerAlbumHomeFeed = async ({ isLoggedIn, localHistory } = {}) => {
  if (isLoggedIn) return fetchLoginAlbumHomeFeed();
  const history = localHistory != null ? localHistory : getListenHistory();
  return fetchGuestAlbumHomeFeed(history);
};
