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

/**
 * Global trending actors (public): /api/recommended-actors/trending
 * @param {{ limit?: number, windowDays?: number }} [opts]
 * @returns {Promise<{ actors: Array<{ actorId: string, score: number }>, limit?: number, windowDays?: number, source?: string }>}
 */
export const fetchTrendingActors = async ({ limit = 40, windowDays } = {}) => {
  const query = new URLSearchParams();
  if (limit) query.set('limit', String(limit));
  if (windowDays) query.set('windowDays', String(windowDays));

  const res = await recommendedActorsFetch(`/recommended-actors/trending?${query.toString()}`);
  const data = await parseJson(res);
  const actors = Array.isArray(data?.actors) ? data.actors : [];

  return {
    actors,
    minScore: data?.minScore,
    limit: data?.limit,
    windowDays: data?.windowDays,
    source: data?.source || (actors.length ? 'actor_watch_credits_trending' : 'empty'),
  };
};

/**
 * Global Top-N actors leaderboard (public): /api/recommended-actors/top
 * @param {{ limit?: number, windowDays?: number }} [opts]
 */
export const fetchTopActors = async ({ limit = 10, windowDays } = {}) => {
  const query = new URLSearchParams();
  if (limit) query.set('limit', String(limit));
  if (windowDays) query.set('windowDays', String(windowDays));

  const res = await recommendedActorsFetch(`/recommended-actors/top?${query.toString()}`);
  const data = await parseJson(res);
  const actors = Array.isArray(data?.actors) ? data.actors : [];

  return {
    actors,
    limit: data?.limit,
    windowDays: data?.windowDays,
    source: data?.source || (actors.length ? 'top_actors' : 'empty'),
  };
};

/**
 * Weekly Top-N actors (public): /api/recommended-actors/weekly-top
 * Rolling 7-day window.
 * @param {{ limit?: number, windowDays?: number }} [opts]
 */
export const fetchWeeklyTopActors = async ({ limit = 10, windowDays } = {}) => {
  const query = new URLSearchParams();
  if (limit) query.set('limit', String(limit));
  if (windowDays) query.set('windowDays', String(windowDays));

  const res = await recommendedActorsFetch(
    `/recommended-actors/weekly-top?${query.toString()}`
  );
  const data = await parseJson(res);
  const actors = Array.isArray(data?.actors) ? data.actors : [];

  return {
    actors,
    limit: data?.limit,
    windowDays: data?.windowDays,
    source: data?.source || (actors.length ? 'weekly_top_actors' : 'empty'),
  };
};
