import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const adminFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Admin request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data !== undefined ? body : body;
};

export const fetchAdminMe = async () => {
  const res = await adminFetch('/admin/me');
  const body = await parseJson(res);
  return body?.data ?? body;
};

export const fetchAdminGenres = async () => {
  const res = await adminFetch('/admin/genres');
  const body = await parseJson(res);
  return body?.data ?? [];
};

export const createAdminGenre = async (payload) => {
  const res = await adminFetch('/admin/genres', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  return body?.data;
};

export const updateAdminGenre = async (id, payload) => {
  const res = await adminFetch(`/admin/genres/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  return body?.data;
};

export const deleteAdminGenre = async (id) => {
  const res = await adminFetch(`/admin/genres/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const body = await parseJson(res);
  return body?.data;
};

export const fetchAdminBanners = async (params = {}) => {
  const q = new URLSearchParams();
  if (params.lang) q.set('lang', params.lang);
  if (params.movieId != null) q.set('movieId', String(params.movieId));
  const qs = q.toString();
  const res = await adminFetch(`/admin/banners${qs ? `?${qs}` : ''}`);
  const body = await parseJson(res);
  return body?.data ?? [];
};

export const createAdminBanner = async (payload) => {
  const res = await adminFetch('/admin/banners', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  return body?.data;
};

export const updateAdminBanner = async (id, payload) => {
  const res = await adminFetch(`/admin/banners/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  return body?.data;
};

export const deleteAdminBanner = async (id) => {
  const res = await adminFetch(`/admin/banners/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const body = await parseJson(res);
  return body?.data;
};
