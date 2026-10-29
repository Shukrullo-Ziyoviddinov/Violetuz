'use strict';

const { randomUUID } = require('node:crypto');
const config = require('../../config');

/**
 * @param {object} item
 */
const publicItem = (item) => ({
  shortId: item.shortId,
  slot: item.slot,
  anchorKey: item.anchorKey == null ? null : item.anchorKey,
  type: item.type,
  contentType: item.contentType == null ? null : item.contentType,
  movieId: item.movieId == null ? null : item.movieId,
  artistId: item.artistId || null,
  musicKey: item.musicKey || null,
  repeat: Boolean(item.repeat),
});

/**
 * History through `position` stays. The next frozenAhead items stay.
 * Everything after that is the new tail.
 * @param {object|null} existing
 * @param {number|undefined} position
 * @param {object[]} built
 * @param {string|null} userId
 * @param {Date} now
 */
const composeSession = (existing, position, built, userId, now) => {
  const current = existing && Array.isArray(existing.items) ? existing.items : [];
  const requested = Number.isInteger(position) && position >= 0 ? position : 0;
  const safePosition = current.length === 0 ? 0 : Math.min(requested, current.length - 1);
  const prefixLength = current.length === 0
    ? 0
    : Math.min(current.length, safePosition + 1 + config.frozenAhead);
  const prefix = current.slice(0, prefixLength).map(publicItem);
  const seen = new Set(prefix.map((item) => item.shortId));
  const items = prefix.slice();
  const fresh = built || [];
  for (let i = 0; i < fresh.length; i += 1) {
    const item = fresh[i];
    if (!item || !item.shortId || seen.has(item.shortId)) continue;
    seen.add(item.shortId);
    items.push(publicItem(item));
  }
  const savedPosition = items.length === 0 ? 0 : Math.min(safePosition, items.length - 1);
  const frozenUntil = items.length === 0 ? 0 : Math.min(items.length - 1, savedPosition + config.frozenAhead);
  return {
    session: {
      sessionId: existing && existing.sessionId ? existing.sessionId : randomUUID(),
      userId: userId || (existing && existing.userId) || null,
      items,
      position: savedPosition,
      updatedAt: now,
    },
    frozenUntil,
    items,
  };
};

/**
 * @param {object[]|undefined} items
 * @param {number} prefixLength
 */
const carriedBlock = (items, prefixLength) => {
  const blockStart = Math.floor(prefixLength / config.slotsPerCycle) * config.slotsPerCycle;
  return (items || []).slice(blockStart, prefixLength);
};

/**
 * @param {{ findById: Function, save: Function }} sessions
 * @param {{ now?: () => Date }} [options]
 */
const createFeedSessionService = (sessions, options = {}) => ({
  /**
   * @param {{ sessionId?: string, userId?: string|null, position?: number, build: Function }} input
   */
  async serve(input) {
    const clock = options.now ? options.now() : new Date();
    const userId = input.userId || null;
    const existing = input.sessionId ? await sessions.findById(input.sessionId) : null;
    const owned = existing && (!userId || !existing.userId || existing.userId === userId);
    const base = owned ? existing : null;
    const preview = composeSession(base, input.position, [], userId, clock);
    const prefix = preview.items;
    const built = await input.build({
      exclude: new Set(prefix.map((item) => item.shortId)),
      prefixLength: prefix.length,
      prefixTail: prefix.length ? prefix[prefix.length - 1] : null,
      carried: carriedBlock(prefix, prefix.length),
    });
    const composed = composeSession(
      base || { sessionId: preview.session.sessionId, userId, items: [] },
      input.position,
      built,
      userId,
      clock
    );
    if (!owned && input.sessionId && existing) {
      composed.session.sessionId = randomUUID();
    }
    await sessions.save(composed.session);
    return {
      sessionId: composed.session.sessionId,
      frozenUntil: composed.frozenUntil,
      items: composed.items,
    };
  },
});

module.exports = {
  publicItem,
  composeSession,
  carriedBlock,
  createFeedSessionService,
};
