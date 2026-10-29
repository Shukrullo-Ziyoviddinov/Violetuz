'use strict';

const collections = require('../../../config/collections');

/**
 * Other songs of the artist, then klip, then konsert.
 * A movie anchor with no resolvable artist yields nothing.
 * @param {object} ctx
 */
const collect = async (ctx) => {
  const anchor = ctx.anchor || {};
  if (!anchor.artistId) return [];
  if (ctx.step === 'other') {
    const filter = { artistId: anchor.artistId };
    if (anchor.musicKey) filter.musicKey = { $ne: anchor.musicKey };
    return ctx.query(filter, ctx.fetchLimit);
  }
  if (ctx.step === 'klip' || ctx.step === 'konsert') {
    const contentType = ctx.step === 'klip'
      ? collections.existing.clips.kind
      : collections.existing.concerts.kind;
    return ctx.query({ artistId: anchor.artistId, contentType }, ctx.fetchLimit);
  }
  return [];
};

module.exports = { collect };
