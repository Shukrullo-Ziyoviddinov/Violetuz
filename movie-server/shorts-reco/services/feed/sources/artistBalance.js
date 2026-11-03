'use strict';

const { artistIdsOf } = require('../../../utils/keys');

/**
 * Bitta artist — bitta so'rov. Bir nechta artist — har biridan navbat bilan.
 * @param {object} ctx
 * @param {object} [extra]
 * @returns {Promise<object[]>}
 */
const balancedByArtist = async (ctx, extra = {}) => {
  const ids = artistIdsOf(ctx.anchor && ctx.anchor.artistId);
  if (!ids.length) return [];
  const limit = ctx.fetchLimit;
  if (ids.length === 1) {
    return ctx.query({ ...extra, artistId: ids[0] }, limit);
  }

  const groups = await Promise.all(
    ids.map((id) => ctx.query({ ...extra, artistId: id }, limit))
  );
  const cursors = groups.map((list) => (Array.isArray(list) ? list.slice() : []));
  const out = [];
  let pending = true;
  while (pending && out.length < limit) {
    pending = false;
    for (let i = 0; i < cursors.length; i += 1) {
      if (!cursors[i].length) continue;
      out.push(cursors[i].shift());
      pending = true;
      if (out.length >= limit) break;
    }
  }
  return out;
};

module.exports = {
  balancedByArtist,
};
