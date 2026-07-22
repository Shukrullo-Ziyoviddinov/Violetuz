import { resolveApiBaseUrl } from './apiBase';

const getApiBaseUrl = () => resolveApiBaseUrl();

/** Used only when production API has not been redeployed yet (404). */
export const FALLBACK_CATEGORIES = [
  { id: 'romantika', title: { uz: 'Romantika', ru: 'Романтика' }, filterCategory: 'Romantika', sortOrder: 1 },
  { id: 'multfilimlar', title: { uz: 'Multfilimlar', ru: 'Мультфильмы' }, filterCategory: 'Multfilimlar', sortOrder: 2 },
  { id: 'anime', title: { uz: 'Anime', ru: 'Аниме' }, filterCategory: 'anime', sortOrder: 3 },
  { id: 'doramalar', title: { uz: 'Doramalar', ru: 'Дорамы' }, filterCategory: 'Doramalar', sortOrder: 4 },
  { id: 'komediya', title: { uz: 'Komediya', ru: 'Комедия' }, filterCategory: 'Komediya', sortOrder: 5 },
  { id: 'jangari', title: { uz: 'Jangari', ru: 'Боевик' }, filterCategory: 'Jangari', sortOrder: 6 },
  { id: 'horror', title: { uz: 'Horror', ru: 'Ужасы' }, filterCategory: 'Horror', sortOrder: 7 },
  { id: 'sarguzasht', title: { uz: 'Sarguzasht', ru: 'Приключения' }, filterCategory: 'Sarguzasht', sortOrder: 8 },
  { id: 'fantastika', title: { uz: 'Fantastika', ru: 'Фантастика' }, filterCategory: 'Fantastika', sortOrder: 9 },
];

export const isCategoryLike = (item) =>
  item &&
  typeof item === 'object' &&
  typeof item.id === 'string' &&
  item.id.trim() !== '' &&
  item.title != null &&
  (typeof item.title === 'string' || typeof item.title === 'object') &&
  (item.filterCategory == null ||
    typeof item.filterCategory === 'string' ||
    (Array.isArray(item.filterCategory) &&
      item.filterCategory.every((value) => typeof value === 'string')));

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
  try {
    const data = await fetchJson(`${getApiBaseUrl()}/categories`);
    const list = normalizeCategoriesPayload(data);
    if (list.length > 0) return list;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[categories] API unavailable, using fallback:', error.message);
    }
  }
  return FALLBACK_CATEGORIES;
};

export const fetchCategoryById = async (id) => {
  try {
    const data = await fetchJson(
      `${getApiBaseUrl()}/categories/${encodeURIComponent(id)}`
    );
    if (isCategoryLike(data?.data)) return data.data;
  } catch {
    // fall through to local fallback
  }
  return FALLBACK_CATEGORIES.find((c) => c.id === String(id)) || null;
};
