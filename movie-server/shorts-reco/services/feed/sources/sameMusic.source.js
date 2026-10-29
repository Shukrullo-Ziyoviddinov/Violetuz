'use strict';

const collections = require('../../../config/collections');

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
    if (!anchor.artistId) return [];
    const filter = { artistId: anchor.artistId };
    if (anchor.contentType) filter.contentType = anchor.contentType;
    return ctx.query(filter, ctx.fetchLimit);
  }
  return [];
};

module.exports = { collect };
