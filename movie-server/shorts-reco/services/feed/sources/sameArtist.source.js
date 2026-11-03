'use strict';

const collections = require('../../../config/collections');
const { artistIdsOf } = require('../../../utils/keys');
const { balancedByArtist } = require('./artistBalance');

/**
 * Other songs of the artist, then klip, then konsert.
 * A movie anchor with no resolvable artist yields nothing.
 * Several artist ids take an equal turn.
 * @param {object} ctx
 */
const collect = async (ctx) => {
  const anchor = ctx.anchor || {};
  if (!artistIdsOf(anchor.artistId).length) return [];
  if (ctx.step === 'other') {
    const extra = {};
    if (anchor.musicKey) extra.musicKey = { $ne: anchor.musicKey };
    return balancedByArtist(ctx, extra);
  }
  if (ctx.step === 'klip' || ctx.step === 'konsert') {
    const contentType = ctx.step === 'klip'
      ? collections.existing.clips.kind
      : collections.existing.concerts.kind;
    return balancedByArtist(ctx, { contentType });
  }
  return [];
};

module.exports = { collect };
