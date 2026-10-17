/**
 * Hamma foydalanuvchidan yig‘ilgan did. Faqat o‘qish.
 * Hisobga ball yozilmaydi. Bo‘lim tartibi o‘zgarmaydi.
 *
 * Shakl shaxsiy did bilan bir xil: janr, davlat, aktyor.
 * watchedMovieCount shu yerda 0 — bu tomoshabinning kinolari emas.
 *
 * @module recommendation-triller/services/crowdTaste.read
 */

'use strict';

const { UserAffinity } = require('../../recommendation/models');
const { scoringWeights } = require('../../recommendation/config/scoringWeights');
const { applyDecay } = require('../../recommendation/utils/decay');
const { ScoreModel } = require('../../recommendation-actors/store');
const { toRankedList } = require('./tasteShape');

const GENRE = scoringWeights.dimensionTypes.genre;
const COUNTRY = scoringWeights.dimensionTypes.country;

/**
 * @returns {Promise<{
 *   ok: true,
 *   source: 'crowd',
 *   genres: Array<{ value: string, score: number }>,
 *   countries: Array<{ value: string, score: number }>,
 *   actors: Array<{ actorId: string, score: number }>,
 *   watchedMovieCount: number
 * }>}
 */
const readCrowdTaste = async () => {
  const [genreCountry, actors] = await Promise.all([
    readCrowdGenreCountry(),
    readCrowdActors(),
  ]);

  return {
    ok: true,
    source: 'crowd',
    genres: genreCountry.genres,
    countries: genreCountry.countries,
    actors,
    watchedMovieCount: 0,
  };
};

const readCrowdGenreCountry = async () => {
  const rows = await UserAffinity.find({
    dimensionType: { $in: [GENRE, COUNTRY] },
  })
    .select({
      dimensionType: 1,
      dimensionValue: 1,
      affinityScore: 1,
      updatedAt: 1,
      _id: 0,
    })
    .lean();

  const genres = new Map();
  const countries = new Map();
  const nowMs = Date.now();

  for (const row of rows || []) {
    const value = String(row.dimensionValue || '').trim();
    if (!value) continue;
    const score = applyDecay(row.affinityScore, row.updatedAt, scoringWeights.decay, nowMs);
    if (score <= 0) continue;
    const target = row.dimensionType === COUNTRY ? countries : genres;
    target.set(value, (target.get(value) || 0) + score);
  }

  return {
    genres: toRankedList(genres),
    countries: toRankedList(countries),
  };
};

const readCrowdActors = async () => {
  const rows = await ScoreModel.aggregate([
    { $match: { score: { $gte: 1 } } },
    { $group: { _id: '$actorId', score: { $sum: '$score' } } },
    { $sort: { score: -1, _id: 1 } },
  ]);

  return (rows || [])
    .map((row) => ({
      actorId: String(row._id),
      score: Number(row.score) || 0,
    }))
    .filter((row) => row.actorId && row.actorId !== 'undefined' && row.score > 0);
};

module.exports = {
  readCrowdTaste,
};
