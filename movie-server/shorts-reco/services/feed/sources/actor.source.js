'use strict';

const collections = require('../../../config/collections');
const { toFiniteNumber } = require('../../../utils/keys');
const { overlaps } = require('./match');

const movieType = collections.existing.shortsVideos.type;

/**
 * Movie shorts whose movie contains the actor and has no watch yet.
 * @param {object} ctx
 */
const collect = async (ctx) => {
  if (ctx.actorId == null || ctx.actorId === '') return [];
  const ids = [ctx.actorId];
  const numeric = toFiniteNumber(ctx.actorId);
  if (numeric != null && !ids.includes(numeric)) ids.push(numeric);
  const filter = { type: movieType, actors: { $in: ids } };
  const engaged = ctx.engagedMovieIds || [];
  if (engaged.length) filter.movieId = { $nin: engaged };
  const docs = await ctx.query(filter, ctx.fetchLimit);
  const genres = (ctx.userTops && ctx.userTops.genres) || [];
  return docs.slice().sort((left, right) => {
    const rightHit = overlaps(right.movieGenres, genres) ? 1 : 0;
    const leftHit = overlaps(left.movieGenres, genres) ? 1 : 0;
    return rightHit - leftHit;
  });
};

module.exports = { collect };
