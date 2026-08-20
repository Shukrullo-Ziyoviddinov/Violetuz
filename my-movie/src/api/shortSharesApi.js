import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const shortSharesFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Share request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

/** Shorts kanal bosilganda +1 hodisa yozadi */
export const recordShortShareRequest = async ({ id, type, channel }) => {
  const res = await shortSharesFetch('/short-shares/events', {
    method: 'POST',
    body: JSON.stringify({ id, type, channel }),
  });
  return parseJson(res);
};
