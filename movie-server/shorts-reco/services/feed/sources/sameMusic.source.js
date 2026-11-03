'use strict';

const collections = require('../../../config/collections');
const { artistIdsOf } = require('../../../utils/keys');
const { balancedByArtist } = require('./artistBalance');

/**
 * musicKey, then same song-group klip, then konsert.
 * Without a song group, the middle step is the same artist and content type.
 * @param {object} ctx
 */
const collect = async (ctx) => {
  const anchor = ctx.anchor || {};
  if (ctx.step === 'musicKey') {
    if (!anchor.musicKey) return [];
    return ctx.query({ musicKey: anchor.musicKey }, ctx.fetchLimit);
  }
  if (ctx.step === 'klip' || ctx.step === 'konsert') {
    if (!anchor.songGroupId) return [];
    const contentType = ctx.step === 'klip'
      ? collections.existing.clips.kind
      : collections.existing.concerts.kind;
    return ctx.query({ songGroupId: anchor.songGroupId, contentType }, ctx.fetchLimit);
  }
  if (ctx.step === 'artistType') {
    if (!artistIdsOf(anchor.artistId).length) return [];
    const extra = {};
    if (anchor.contentType) extra.contentType = anchor.contentType;
    return balancedByArtist(ctx, extra);
  }
  return [];
};

module.exports = { collect };
