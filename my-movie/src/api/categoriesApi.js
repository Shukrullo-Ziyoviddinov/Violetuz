import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isCategoryLike = (item) =>
  item &&
  typeof item === 'object' &&
  typeof item.id === 'string' &&
  item.title != null &&
  (typeof item.filterCategory === 'string' || Array.isArray(item.filterCategory));

export const normalizeCategoriesPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isCategoryLike);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Categories API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllCategories = async () => {
  const data = await fetchJson(`${API_BASE_URL}/categories`);
  return normalizeCategoriesPayload(data);
};

export const fetchCategoryById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/categories/${encodeURIComponent(id)}`);
  return isCategoryLike(data?.data) ? data.data : null;
};
