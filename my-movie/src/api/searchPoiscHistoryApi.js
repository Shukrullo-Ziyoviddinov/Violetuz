import { resolveApiBaseUrl } from './apiBase';

/**
 * Qidiruv click tarixi API.
 * Base: /api/search-poisc-history
 * Faqat login (credentials: include). Query matni yuborilmaydi.
 */

const API_BASE_URL = resolveApiBaseUrl();

const historyFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Search history request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

/**
 * @param {{ limit?: number }} [options]
 * @returns {Promise<{ items: Array<{ id: string|number, type: string, snapshot?: object, clickedAt?: string }> }>}
 */
export const fetchSearchPoiscHistory = async ({ limit } = {}) => {
  const q =
    limit != null && limit !== ''
      ? `?limit=${encodeURIComponent(String(limit))}`
      : '';
  const res = await historyFetch(`/search-poisc-history${q}`);
  return parseJson(res);
};

/**
 * Search natijasidan click — faqat { id, type }.
 * type: movie | music | klip | konsert (clip/concert ham qabul qilinadi).
 */
export const recordSearchPoiscHistoryClick = async ({ id, type }) => {
  const res = await historyFetch('/search-poisc-history/items', {
    method: 'POST',
    body: JSON.stringify({ id, type }),
  });
  return parseJson(res);
};

export const removeSearchPoiscHistoryItem = async ({ id, type }) => {
  const res = await historyFetch('/search-poisc-history/items', {
    method: 'DELETE',
    body: JSON.stringify({ id, type }),
  });
  return parseJson(res);
};

export const clearSearchPoiscHistory = async () => {
  const res = await historyFetch('/search-poisc-history', {
    method: 'DELETE',
  });
  return parseJson(res);
};
