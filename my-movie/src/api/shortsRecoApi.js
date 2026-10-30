import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const fetchJson = async (url, options) => {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options && options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options && options.headers),
    },
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    throw new Error(`Shorts reco API error: ${res.status}`);
  }
  return res.json();
};

export const fetchShortsShelf = async ({ type, block = 0, limit = 10 }) => {
  const params = new URLSearchParams({
    type: String(type),
    block: String(block),
    limit: String(limit),
  });
  return fetchJson(`${API_BASE_URL}/shorts-reco/shelf?${params.toString()}`);
};

export const fetchShortsRecoFeed = async ({ sessionId, position = 0, limit = 20 } = {}) => {
  const params = new URLSearchParams({
    position: String(position),
    limit: String(limit),
  });
  if (sessionId) params.set('sessionId', sessionId);
  return fetchJson(`${API_BASE_URL}/shorts-reco/feed?${params.toString()}`);
};

export const postShortsRecoEvent = async ({ shortId, passRatio, playedMsDelta, completionsDelta }) => {
  const eventId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : null;
  if (!eventId || shortId == null) return null;
  const body = {
    eventId,
    shortId,
    passRatio,
    playedMsDelta,
  };
  if (completionsDelta != null) body.completionsDelta = completionsDelta;
  return fetchJson(`${API_BASE_URL}/shorts-reco/events`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};
