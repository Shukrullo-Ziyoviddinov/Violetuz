import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const followingFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Following request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

export const fetchFollowing = async ({ type } = {}) => {
  const q = type ? `?type=${encodeURIComponent(type)}` : '';
  const res = await followingFetch(`/following${q}`);
  return parseJson(res);
};

export const replaceFollowingRequest = async (items) => {
  const res = await followingFetch('/following', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
  return parseJson(res);
};

export const addFollowRequest = async ({ id, type }) => {
  const res = await followingFetch('/following', {
    method: 'POST',
    body: JSON.stringify({ id, type }),
  });
  return parseJson(res);
};

export const removeFollowRequest = async ({ id, type }) => {
  const res = await followingFetch('/following', {
    method: 'DELETE',
    body: JSON.stringify({ id, type }),
  });
  return parseJson(res);
};

export const toggleFollowRequest = async ({ id, type }) => {
  const res = await followingFetch('/following/toggle', {
    method: 'POST',
    body: JSON.stringify({ id, type }),
  });
  return parseJson(res);
};
