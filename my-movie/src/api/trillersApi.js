import { resolveApiBaseUrl } from './apiBase';
import { getWatchHistory as getMovieGuestWatchHistory } from '../utils/localStorage/guestHistory/movieGuestHistory';
import { getGuestTrillerProgress } from '../utils/localStorage/trillerGuestProgress';

const API_BASE_URL = resolveApiBaseUrl();

export const isTrillerLike = (item) =>
  item &&
  typeof item === 'object' &&
  item.id != null &&
  item.title &&
  item.video &&
  item.videoImg;

export const normalizeTrillersPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isTrillerLike);
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
    throw new Error(`Trillers API error: ${res.status}`);
  }
  return res.json();
};

export const fetchLoginTrillers = async ({ signal } = {}) => {
  const data = await fetchJson(`${API_BASE_URL}/trillers`, { signal });
  return normalizeTrillersPayload(data);
};

export const fetchGuestTrillers = async ({ localHistory, videoProgress, signal } = {}) => {
  const history = localHistory != null ? localHistory : getMovieGuestWatchHistory();
  const progress = videoProgress != null ? videoProgress : getGuestTrillerProgress();
  const data = await fetchJson(`${API_BASE_URL}/trillers/guest`, {
    method: 'POST',
    signal,
    body: JSON.stringify({
      localHistory: Array.isArray(history) ? history : [],
      videoProgress: (Array.isArray(progress) ? progress : []).map((row) => ({
        id: row?.id,
        r: row?.r,
      })),
    }),
  });
  return normalizeTrillersPayload(data);
};

/**
 * Hisob: GET, cookie. Mehmon: POST local tarix. Local hisobga yozilmaydi.
 * @param {{ isLoggedIn?: boolean, localHistory?: unknown, videoProgress?: unknown }} [opts]
 */
export const fetchAllTrillers = async ({ isLoggedIn = false, localHistory, videoProgress, signal } = {}) => {
  if (isLoggedIn) return fetchLoginTrillers({ signal });
  return fetchGuestTrillers({ localHistory, videoProgress, signal });
};

export const fetchTrillerById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/trillers/${encodeURIComponent(id)}`);
  return isTrillerLike(data?.data) ? data.data : null;
};
