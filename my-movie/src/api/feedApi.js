import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const feedFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Feed request failed');
    err.status = response.status;
    throw err;
  }
  return body?.data ?? body;
};

/**
 * @returns {Promise<{ items: object[], offset: number, limit: number, hasMore: boolean, total: number }>}
 */
export const fetchFeed = async ({ type = 'all', offset = 0, limit = 12 } = {}) => {
  const q = new URLSearchParams();
  if (type) q.set('type', type);
  q.set('offset', String(offset));
  q.set('limit', String(limit));
  const res = await feedFetch(`/feed?${q.toString()}`);
  const data = await parseJson(res);
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    offset: Number(data?.offset) || 0,
    limit: Number(data?.limit) || limit,
    hasMore: Boolean(data?.hasMore),
    total: Number(data?.total) || 0,
  };
};
