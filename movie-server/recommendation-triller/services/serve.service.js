/**
 * Parda ortida ro‘yxati. Faqat o‘qiydi, bo‘lim algoritmiga yozmaydi.
 * Hisob bo‘lsa local tarix e’tiborsiz.
 *
 * @module recommendation-triller/services/serve.service
 */

'use strict';

const trillerService = require('../../services/triller.service');
const { UserMovieProgress } = require('../../recommendation/models');
const { sanitizeLocalHistory } = require('../../recommendation/services/guestAffinityBuilder.service');
const { badRequest } = require('../../utils/errors');
const { readTaste } = require('./taste.read');
const { assembleTrillerRow } = require('./assembleRow');
const { listByUser } = require('../repositories/userTrillerProgress.repository');
const { MIN_WATCHED_SECONDS } = require('./crowdFade');

const MAX_VIDEO_PROGRESS = 200;

const hasAccount = (userId) => userId != null && userId !== '';

const guestCompletion = (videoProgress) => {
  const rows = Array.isArray(videoProgress) ? videoProgress.slice(0, MAX_VIDEO_PROGRESS) : [];
  /** @type {Object.<string, number>} */
  const completionById = {};

  for (const row of rows) {
    const id = Number(row?.id ?? row?.trillerId);
    const rate = Number(row?.r ?? row?.completionRate);
    if (!Number.isInteger(id) || id <= 0) continue;
    if (!Number.isFinite(rate) || rate <= 0) continue;
    const next = Math.min(1, rate);
    const prev = completionById[id] || 0;
    if (next > prev) completionById[id] = next;
  }

  return completionById;
};

const guestRecentMovies = (localHistory) => {
  const sanitized = sanitizeLocalHistory(localHistory);
  if (!sanitized.ok) return [];

  /** @type {Map<number, { movieId: number, watchedAt: number }>} */
  const byId = new Map();
  for (const event of sanitized.events) {
    const movieId = Number(event.m);
    const watchedAt = Number(event.t);
    if (!Number.isInteger(movieId) || movieId <= 0 || !Number.isFinite(watchedAt)) continue;
    const prev = byId.get(movieId);
    if (!prev || watchedAt > prev.watchedAt) {
      byId.set(movieId, { movieId, watchedAt });
    }
  }

  return [...byId.values()];
};

const accountCompletion = async (userId) => {
  const rows = await listByUser(userId);
  /** @type {Object.<string, number>} */
  const completionById = {};
  for (const row of rows) {
    if (!Number.isInteger(row.trillerId) || row.trillerId <= 0) continue;
    completionById[row.trillerId] = row.completionRate;
  }
  return completionById;
};

const accountRecentMovies = async (userId) => {
  const rows = await UserMovieProgress.find({
    userId,
    watchedSeconds: { $gte: MIN_WATCHED_SECONDS },
  })
    .select({ movieId: 1, updatedAt: 1, _id: 0 })
    .lean();

  return (rows || [])
    .map((row) => ({
      movieId: Number(row.movieId),
      watchedAt: row.updatedAt,
    }))
    .filter((row) => Number.isInteger(row.movieId) && row.movieId > 0);
};

const userAgeOf = (value) => {
  if (value == null || value === '') return undefined;
  const age = Number(value);
  if (!Number.isFinite(age) || age < 0) return undefined;
  return age;
};

/**
 * @param {{ userId?: *, localHistory?: unknown, videoProgress?: unknown, userAge?: number }} [input]
 * @returns {Promise<Object[]>}
 */
const serveTrillerList = async (input = {}) => {
  const videos = await trillerService.getAll();
  const account = hasAccount(input.userId);

  const taste = account
    ? await readTaste({ userId: input.userId })
    : await readTaste({ localHistory: input.localHistory });

  if (!taste || taste.ok === false) {
    throw badRequest(taste?.error || 'Did o‘qilmadi');
  }

  const [completionById, recentMovies] = await Promise.all([
    account ? accountCompletion(input.userId) : Promise.resolve(guestCompletion(input.videoProgress)),
    account ? accountRecentMovies(input.userId) : Promise.resolve(guestRecentMovies(input.localHistory)),
  ]);

  const row = assembleTrillerRow({
    videos,
    completionById,
    recentMovies,
    taste,
    userAge: userAgeOf(input.userAge),
  });

  return row.order;
};

module.exports = {
  serveTrillerList,
  guestCompletion,
  guestRecentMovies,
};
