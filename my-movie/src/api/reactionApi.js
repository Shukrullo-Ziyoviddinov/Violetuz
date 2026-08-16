import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const reactionFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Reaction request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

export const fetchReactions = async ({ type } = {}) => {
  const q = type ? `?type=${encodeURIComponent(type)}` : '';
  const res = await reactionFetch(`/reactions${q}`);
  return parseJson(res);
};

export const fetchLikeHistory = async () => {
  const res = await reactionFetch('/reactions/history');
  return parseJson(res);
};

export const replaceReactionsRequest = async (items) => {
  const res = await reactionFetch('/reactions', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
  return parseJson(res);
};

/** value: 'like' | 'dislike' | 'none' */
export const setReactionRequest = async ({ id, type, value }) => {
  const res = await reactionFetch('/reactions', {
    method: 'POST',
    body: JSON.stringify({ id, type, value }),
  });
  return parseJson(res);
};

export const toggleShortsLikeRequest = async ({ id }) => {
  const res = await reactionFetch('/reactions/shorts/toggle', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  return parseJson(res);
};
