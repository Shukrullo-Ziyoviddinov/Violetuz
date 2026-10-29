'use strict';

const { feedScoreOf } = require('../../affinity.service');

/**
 * Long-term affinity over a bounded candidate window. Unseen filtering is later.
 * @param {object} ctx
 */
const collect = async (ctx) => {
  const newest = await ctx.query({}, ctx.similarLimit || ctx.fetchLimit, { catalogAddedAt: -1 });
  const tops = ctx.userTops || {};
  const extra = [];
  if ((tops.genres || []).length) {
    extra.push(...await ctx.query({ movieGenres: { $in: tops.genres } }, ctx.fetchLimit));
  }
  if ((tops.musicGenres || []).length) {
    extra.push(...await ctx.query({ musicGenres: { $in: tops.musicGenres } }, ctx.fetchLimit));
  }
  const seen = new Set();
  const docs = [];
  newest.concat(extra).forEach((doc) => {
    if (!doc || seen.has(doc.shortId)) return;
    seen.add(doc.shortId);
    docs.push(doc);
  });
  const profile = ctx.profile || { longTerm: {}, session: { items: [] } };
  const stats = ctx.statsByShortId || new Map();
  return docs.sort((left, right) => (
    feedScoreOf(right, profile, stats.get(right.shortId), ctx.now)
    - feedScoreOf(left, profile, stats.get(left.shortId), ctx.now)
  ));
};

module.exports = { collect };
