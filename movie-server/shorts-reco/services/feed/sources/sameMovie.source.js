'use strict';

const collections = require('../../../config/collections');

const movieType = collections.existing.shortsVideos.type;

/**
 * Unseen movie shorts of the anchor movie. The builder decides repeats.
 * @param {object} ctx
 */
const collect = async (ctx) => {
  const anchor = ctx.anchor;
  if (!anchor || anchor.movieId == null) return [];
  return ctx.query({ type: movieType, movieId: anchor.movieId }, ctx.fetchLimit);
};

module.exports = { collect };
