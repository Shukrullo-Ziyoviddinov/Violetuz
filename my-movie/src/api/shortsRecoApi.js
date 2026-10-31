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

export const fetchShortsRecoPage = async () => (
  fetchJson(`${API_BASE_URL}/shorts-reco/page`)
);

export const fetchShortsRecoFeed = async ({ sessionId, position = 0, limit = 20, focus } = {}) => {
  const params = new URLSearchParams({
    position: String(position),
    limit: String(limit),
  });
  if (sessionId) params.set('sessionId', sessionId);
  if (focus != null && focus !== '') params.set('focus', String(focus));
  return fetchJson(`${API_BASE_URL}/shorts-reco/feed?${params.toString()}`);
};

export const postShortsRecoEvent = async (event) => {
  const eventId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : null;
  if (!eventId || !event || event.shortId == null) return null;
  const body = {
    eventId,
    shortId: event.shortId,
    passRatio: event.passRatio,
    playedMsDelta: event.playedMsDelta,
    final: event.final !== false,
  };
  if (event.completionsDelta != null) body.completionsDelta = event.completionsDelta;
  if (event.viewId) body.viewId = event.viewId;
  if (event.seq != null) body.seq = event.seq;
  if (event.liked != null) body.liked = event.liked;
  if (event.commented != null) body.commented = event.commented;
  if (event.shared != null) body.shared = event.shared;
  return fetchJson(`${API_BASE_URL}/shorts-reco/events`, {
    method: 'POST',
    body: JSON.stringify(body),
    keepalive: true,
  });
};
