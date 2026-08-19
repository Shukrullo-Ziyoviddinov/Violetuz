import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const repostsFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Repost request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

/** @returns {Promise<{ items: Array<object> }>} */
export const fetchReposts = async ({ type } = {}) => {
  const q = type ? `?type=${encodeURIComponent(type)}` : '';
  const res = await repostsFetch(`/reposts${q}`);
  return parseJson(res);
};

/** Tugma holati uchun — faqat id + type */
export const fetchRepostIds = async ({ type } = {}) => {
  const q = type ? `?type=${encodeURIComponent(type)}` : '';
  const res = await repostsFetch(`/reposts/ids${q}`);
  return parseJson(res);
};

/** Bir martalik migratsiya: eski local ro‘yxatni serverga ko‘chirish */
export const replaceRepostsRequest = async (items) => {
  const res = await repostsFetch('/reposts', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
  return parseJson(res);
};

export const addRepostRequest = async ({ id, type }) => {
  const res = await repostsFetch('/reposts/items', {
    method: 'POST',
    body: JSON.stringify({ id, type }),
  });
  return parseJson(res);
};

export const removeRepostRequest = async ({ id, type }) => {
  const res = await repostsFetch('/reposts/items', {
    method: 'DELETE',
    body: JSON.stringify({ id, type }),
  });
  return parseJson(res);
};

export const toggleRepostRequest = async ({ id, type }) => {
  const res = await repostsFetch('/reposts/items/toggle', {
    method: 'POST',
    body: JSON.stringify({ id, type }),
  });
  return parseJson(res);
};
