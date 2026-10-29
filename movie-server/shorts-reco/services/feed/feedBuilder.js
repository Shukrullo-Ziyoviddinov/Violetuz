'use strict';

const config = require('../../config');
const { seenStatus, orderRepeats, canRepeat } = require('../eligibility.service');
const { mixColdStart } = require('../coldStart.service');
const { currentBlock, accepts } = require('./diversity');
const { chainFor, fallbacksFor } = require('./chains');
const { runStep } = require('./sources');

/**
 * @param {object} doc
 * @param {{ source: string }} slot
 * @param {string|null} anchorKey
 * @param {boolean} repeat
 */
const toItem = (doc, slot, anchorKey, repeat) => ({
  shortId: doc.shortId,
  slot: slot.source,
  anchorKey: anchorKey || null,
  type: doc.type,
  contentType: doc.contentType == null ? null : doc.contentType,
  movieId: doc.movieId == null ? null : doc.movieId,
  artistId: doc.artistId || null,
  musicKey: doc.musicKey || null,
  repeat: Boolean(repeat),
});

/**
 * @param {object[]} docs
 * @param {object[]} picked
 * @param {object} ctx
 */
const firstAccepted = (docs, picked, ctx) => {
  for (let i = 0; i < docs.length; i += 1) {
    const doc = docs[i];
    if (!doc || !doc.shortId) continue;
    if (ctx.exclude && ctx.exclude.has(doc.shortId)) continue;
    if (picked.some((item) => item.shortId === doc.shortId)) continue;
    if (accepts(picked, doc, ctx)) return doc;
  }
  return null;
};

/**
 * @param {object[]} picked
 * @param {object} ctx
 */
const repeatsInBlock = (picked, ctx) =>
  currentBlock(ctx.carried || [], picked, ctx.prefixLength || 0)
    .filter((item) => item.repeat).length;

/**
 * @param {object} state
 * @returns {Promise<object|null>}
 */
const fillSlot = async (state) => {
  const { slot, ctx, picked, allowFallback } = state;
  const chain = chainFor(slot, ctx.anchor);
  const repeatPool = [];
  let unseenRemaining = false;
  const anchorKey = ctx.anchor ? ctx.anchor.key : null;

  for (let i = 0; i < chain.length; i += 1) {
    const step = chain[i];
    const docs = await runStep(step, { ...ctx, actorId: ctx.actorId });
    const unseen = [];
    for (let d = 0; d < docs.length; d += 1) {
      const doc = docs[d];
      if (!doc || !doc.shortId) continue;
      if (ctx.exclude && ctx.exclude.has(doc.shortId)) continue;
      if (picked.some((item) => item.shortId === doc.shortId)) continue;
      const status = seenStatus(ctx.watches.get(doc.shortId), ctx.now);
      if (status === 'unseen') unseen.push(doc);
      else if (status === 'repeat' && step.repeats) repeatPool.push(doc);
    }
    const choice = firstAccepted(unseen, picked, ctx);
    if (choice) return toItem(choice, slot, anchorKey, false);
    if (unseen.length) unseenRemaining = true;
    const blocked = docs.some((doc) => seenStatus(ctx.watches.get(doc.shortId), ctx.now) === 'blocked');
    if (blocked && docs.length >= ctx.fetchLimit && unseen.length === 0) unseenRemaining = true;
  }

  const anchorIsTop2 = Boolean(ctx.anchor && ctx.topAnchorKeys && ctx.topAnchorKeys.includes(anchorKey));
  if (canRepeat({
    anchorIsTop2,
    unseenRemaining,
    repeatsUsed: repeatsInBlock(picked, ctx),
  })) {
    const ordered = orderRepeats(repeatPool, ctx.watches);
    const choice = firstAccepted(ordered, picked, ctx);
    if (choice) return toItem(choice, slot, anchorKey, true);
  }

  if (!allowFallback) return null;
  const fallbacks = fallbacksFor(slot.source);
  for (let i = 0; i < fallbacks.length; i += 1) {
    const nested = await fillSlot({
      ...state,
      slot: { source: fallbacks[i] },
      allowFallback: false,
    });
    if (nested) return nested;
  }
  return null;
};

/**
 * @param {object[]} docs
 * @param {string} slotName
 * @param {object} ctx
 */
const placeDiverse = (docs, slotName, ctx) => {
  const picked = [];
  for (let i = 0; i < docs.length; i += 1) {
    const doc = docs[i];
    if (!doc || picked.some((item) => item.shortId === doc.shortId)) continue;
    if (ctx.exclude && ctx.exclude.has(doc.shortId)) continue;
    if (!accepts(picked, doc, ctx)) continue;
    picked.push(toItem(doc, { source: slotName }, null, false));
    if (picked.length >= (ctx.limit || config.feedBatchSize)) break;
  }
  return picked;
};

/**
 * @param {object} ctx
 * @returns {Promise<object[]>}
 */
const buildFeed = async (ctx) => {
  const state = ctx || {};
  state.watches = state.watches || new Map();
  state.exclude = state.exclude || new Set();
  state.fetchLimit = state.fetchLimit || config.candidateFetchLimit;
  state.now = state.now || new Date();
  const limit = state.limit || config.feedBatchSize;
  if (state.cold) {
    const mixed = mixColdStart({
      docs: state.coldPool || [],
      popularIds: state.popularIds || [],
      limit,
      profileDocs: state.profileDocs || [],
      viewCount: state.viewCount || 0,
    });
    return placeDiverse(mixed, 'explore', state);
  }

  const picked = [];
  const actorQueue = (state.actorQueue || []).slice();
  const slots = state.slots || [];
  for (let i = 0; i < slots.length && picked.length < limit; i += 1) {
    const slot = slots[i];
    state.actorId = slot.source === 'actor' ? actorQueue.shift() || null : null;
    const item = await fillSlot({ slot, ctx: state, picked, allowFallback: true });
    if (item) picked.push(item);
  }
  return picked;
};

module.exports = {
  buildFeed,
  toItem,
};
