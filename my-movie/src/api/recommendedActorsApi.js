/**
 * Recommended actors carousel API (distinct watched-movie counts).
 * GET /api/recommended-actors
 */
import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const recommendedActorsFetch = (path, options = {}) =>
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
    const err = new Error(body?.message || 'Recommended actors request failed');
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }
  return body?.data ?? body;
};

/**
 * Personalized actors for .recommended-actors (score = distinct watched movies).
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<{ actors: Array<{ actorId: string, score: number }>, minScore?: number, source?: string }>}
 */
export const fetchRecommendedActors = async ({ limit = 40 } = {}) => {
  const query = new URLSearchParams();
  if (limit) query.set('limit', String(limit));

  const res = await recommendedActorsFetch(
    `/recommended-actors?${query.toString()}`
  );
  const data = await parseJson(res);
  const actors = Array.isArray(data?.actors) ? data.actors : [];

  return {
    actors,
    minScore: data?.minScore,
    limit: data?.limit,
    source: data?.source || (actors.length ? 'actor_watch_score' : 'empty'),
  };
};
