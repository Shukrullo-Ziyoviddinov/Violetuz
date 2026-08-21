import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const downloadsFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Download request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

/** Jami yuklab olishlar soni */
export const fetchShortDownloadCount = async ({ id, type }) => {
  const q = new URLSearchParams({
    id: String(id),
    type: String(type),
  });
  const res = await downloadsFetch(`/short-downloads/count?${q}`);
  return parseJson(res);
};

/**
 * Client R2 dan 100% yuklab bo‘lgach +1.
 * Server diskka yozmaydi.
 */
export const recordShortDownloadRequest = async ({ id, type }) => {
  const res = await downloadsFetch('/short-downloads/events', {
    method: 'POST',
    body: JSON.stringify({ id, type }),
  });
  return parseJson(res);
};
