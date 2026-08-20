import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const viewsFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'View request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

/** Jami ko‘rishlar soni (auth shart emas) */
export const fetchViewCount = async ({ id, type }) => {
  const q = new URLSearchParams({
    id: String(id),
    type: String(type),
  });
  const res = await viewsFetch(`/views/count?${q}`);
  return parseJson(res);
};

/**
 * Login user uchun ko‘rishni yozadi (bir user + id = bir marta).
 * @returns {Promise<{ viewCount: number, recorded: boolean }>}
 */
export const recordViewRequest = async ({ id, type }) => {
  const res = await viewsFetch('/views', {
    method: 'POST',
    body: JSON.stringify({ id, type }),
  });
  return parseJson(res);
};
