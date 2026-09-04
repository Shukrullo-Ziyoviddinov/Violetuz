/**
 * Category-based personalized recommendations API.
 * Faqat movie.categoryName bo‘limlari uchun (RecommendedPage / home sections).
 * SearchModalTavsiya, topRated, similar, nav chips (filterCategory) — ulanmaydi.
 */
import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const recommendationsFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Recommendations request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

/**
 * Faqat haqiqiy categoryName bo‘limlari uchun kalit qaytaradi.
 * Nav chip (romantika, komediya, …) → null.
 *
 * @param {Object} params
 * @param {string} [params.pathname]
 * @param {string} [params.categoryId]
 * @param {string[]} [params.sectionCategoryNames] — movie-sections.categoryName list
 * @returns {string|null}
 */
export const resolveRecommendationCategoryKey = ({
  pathname = '',
  categoryId = null,
  sectionCategoryNames = [],
} = {}) => {
  if (String(pathname).startsWith('/similar-movies')) return null;
  if (categoryId === 'topRated') return null;
  if (pathname === '/recommended') return 'movies';

  const known = new Set(
    (sectionCategoryNames || []).filter((name) => typeof name === 'string' && name.trim())
  );

  const id = typeof categoryId === 'string' ? categoryId.trim() : '';
  if (!id) return null;

  // Faqat home/section categoryName (actionMovies, koreaDrama, anime, …)
  if (known.has(id)) return id;

  return null;
};

/**
 * Personalized list for a categoryName section.
 * Auth cookie/Bearer yetarli — server req.authUser dan oladi.
 *
 * @param {Object} opts
 * @param {string} opts.category
 * @param {number} [opts.limit]
 * @param {boolean} [opts.hydrate]
 * @param {boolean} [opts.lazy] — Home: sync precompute o‘rniga queue + SWR
 * @returns {Promise<{ movies: Array, source?: string, category?: string, items?: Array, queuedRefresh?: boolean }>}
 */
export const fetchCategoryRecommendations = async ({
  category,
  limit = 120,
  hydrate = true,
  lazy = false,
} = {}) => {
  const categoryKey = String(category || '').trim();
  if (!categoryKey) {
    throw new Error('category is required');
  }

  const query = new URLSearchParams();
  if (limit) query.set('limit', String(limit));
  if (hydrate === false) query.set('hydrate', 'false');
  if (lazy) query.set('lazy', '1');

  const res = await recommendationsFetch(
    `/recommendations/${encodeURIComponent(categoryKey)}?${query.toString()}`
  );
  const data = await parseJson(res);
  const movies = Array.isArray(data?.movies) ? data.movies : [];

  return {
    movies,
    source: data?.source,
    category: data?.category || categoryKey,
    items: Array.isArray(data?.items) ? data.items : [],
    generatedAt: data?.generatedAt || null,
    queuedRefresh: Boolean(data?.queuedRefresh),
  };
};

/**
 * Watch progress upsert (max completion / watchedSeconds).
 * POST /api/recommendations/progress
 */
export const reportMovieProgress = async ({
  movieId,
  watchedSeconds,
  completionRate,
  durationSec,
  category,
} = {}) => {
  const res = await recommendationsFetch('/recommendations/progress', {
    method: 'POST',
    body: JSON.stringify({
      movieId: movieId ?? undefined,
      id: movieId ?? undefined,
      watchedSeconds,
      completionRate,
      durationSec,
      category,
    }),
  });
  return parseJson(res);
};

/** Defaults — server `scoringWeights.progress` bilan sync (fallback). */
export const DEFAULT_PROGRESS_CONFIG = Object.freeze({
  minWatchedSeconds: 300,
  shortFilmCompleteRatio: 0.8,
  affinityMinDelta: 0.1,
});

/**
 * Server threshold knobs (FE/BE copy-paste drift oldini olish).
 * GET /api/recommendations/config/progress
 */
export const fetchProgressConfig = async () => {
  const res = await recommendationsFetch('/recommendations/config/progress');
  const data = await parseJson(res);
  return {
    minWatchedSeconds:
      Number(data?.minWatchedSeconds) || DEFAULT_PROGRESS_CONFIG.minWatchedSeconds,
    shortFilmCompleteRatio:
      Number(data?.shortFilmCompleteRatio) ||
      DEFAULT_PROGRESS_CONFIG.shortFilmCompleteRatio,
    affinityMinDelta:
      Number(data?.affinityMinDelta) || DEFAULT_PROGRESS_CONFIG.affinityMinDelta,
  };
};
