import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const wishlistFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Wishlist request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

/** @returns {Promise<{ items: Array<{ id: string|number, type: string, snapshot?: object }> }>} */
export const fetchWishlist = async ({ type } = {}) => {
  const q = type ? `?type=${encodeURIComponent(type)}` : '';
  const res = await wishlistFetch(`/wishlist${q}`);
  return parseJson(res);
};

/** To‘liq almashtirish / localStorage migratsiya */
export const replaceWishlistRequest = async (items) => {
  const res = await wishlistFetch('/wishlist', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
  return parseJson(res);
};

export const addWishlistItemRequest = async ({ id, type = 'movie' }) => {
  const res = await wishlistFetch('/wishlist/items', {
    method: 'POST',
    body: JSON.stringify({ id, type }),
  });
  return parseJson(res);
};

export const removeWishlistItemRequest = async ({ id, type }) => {
  const res = await wishlistFetch('/wishlist/items', {
    method: 'DELETE',
    body: JSON.stringify({ id, type }),
  });
  return parseJson(res);
};

export const toggleWishlistItemRequest = async ({ id, type = 'movie' }) => {
  const res = await wishlistFetch('/wishlist/items/toggle', {
    method: 'POST',
    body: JSON.stringify({ id, type }),
  });
  return parseJson(res);
};
