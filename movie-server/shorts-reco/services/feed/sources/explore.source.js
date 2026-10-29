'use strict';

/**
 * Newest, then popular, then a stable spread through the newest window.
 * The spread is fixed so two calls with the same catalog do not reshuffle.
 * @param {object[]} docs
 * @param {number} limit
 */
const spreadPick = (docs, limit) => {
  if (!docs.length || limit <= 0) return [];
  const step = Math.max(1, Math.floor(docs.length / limit));
  const out = [];
  for (let i = 0; i < docs.length && out.length < limit; i += step) out.push(docs[i]);
  return out;
};

/**
 * @param {object[][]} lists
 * @param {number} limit
 */
const interleave = (lists, limit) => {
  const out = [];
  const seen = new Set();
  const max = lists.reduce((size, list) => Math.max(size, list.length), 0);
  for (let i = 0; i < max && out.length < limit; i += 1) {
    for (let list = 0; list < lists.length && out.length < limit; list += 1) {
      const doc = lists[list][i];
      if (!doc || seen.has(doc.shortId)) continue;
      seen.add(doc.shortId);
      out.push(doc);
    }
  }
  return out;
};

/**
 * @param {object} ctx
 */
const collect = async (ctx) => {
  const limit = ctx.fetchLimit;
  const newest = await ctx.query({}, limit, { catalogAddedAt: -1 });
  const popular = [];
  const ids = ctx.popularIds || [];
  for (let i = 0; i < ids.length && popular.length < limit; i += 1) {
    const found = newest.find((doc) => doc.shortId === ids[i])
      || (await ctx.query({ shortId: ids[i] }, 1))[0];
    if (found) popular.push(found);
  }
  return interleave([newest, popular, spreadPick(newest, limit)], limit);
};

module.exports = { collect };
