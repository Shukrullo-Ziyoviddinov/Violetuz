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
 * The opened short leads a new session so the player index matches the server.
 * @param {object[]} items
 * @param {object|null} focusItem
 */
const placeFocus = (items, focusItem) => {
  if (!focusItem || !focusItem.shortId) return items || [];
  const list = (items || []).slice();
  const index = list.findIndex((item) => item && item.shortId === focusItem.shortId);
  if (index === 0) return list;
  if (index > 0) {
    const [picked] = list.splice(index, 1);
    list.unshift(picked);
    return list;
  }
  list.unshift(focusItem);
  return list;
};

/**
 * Remember the furthest short opened in this session.
 * @param {object|null} session
 * @param {number|undefined} position
 * @returns {boolean}
 */
const rememberPosition = (session, position) => {
  if (!session || !Array.isArray(session.items) || session.items.length === 0) return false;
  const requested = Number.isInteger(position) && position >= 0 ? position : 0;
  const capped = Math.min(requested, session.items.length - 1);
  const stored = Number.isInteger(session.maxPosition) ? session.maxPosition : 0;
  if (capped <= stored) return false;
  session.maxPosition = capped;
  return true;
};

const reachedPosition = (session, position, length) => {
  const requested = Number.isInteger(position) && position >= 0 ? position : 0;
  const safe = length === 0 ? 0 : Math.min(requested, Math.max(0, length - 1));
  const stored = session && Number.isInteger(session.maxPosition) ? session.maxPosition : 0;
  return { safe, furthest: Math.max(stored, safe) };
};

/**
 * At the far end, keep the on-screen short and the next frozenAhead items.
 * After a scroll back, keep every short through the furthest one already opened.
 * @param {number} length
 * @param {number} safe
 * @param {number} furthest
 */
const prefixLengthFor = (length, safe, furthest) => {
  if (length === 0) return 0;
  const end = safe < furthest ? furthest + 1 : safe + 1 + config.frozenAhead;
  return Math.min(length, end);
};

/**
 * History through `position` stays. The next frozenAhead items stay.
 * A scroll back keeps the list through the furthest opened short.
 * @param {object|null} existing
 * @param {number|undefined} position
 * @param {object[]} built
 * @param {string|null} userId
 * @param {Date} now
 */
const composeSession = (existing, position, built, userId, now) => {
  const current = existing && Array.isArray(existing.items) ? existing.items : [];
  const reached = reachedPosition(existing, position, current.length);
  const prefixLength = prefixLengthFor(current.length, reached.safe, reached.furthest);
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
  const savedPosition = items.length === 0 ? 0 : Math.min(reached.safe, items.length - 1);
  const savedFurthest = Math.max(reached.furthest, savedPosition);
  const frozenEnd = savedPosition < savedFurthest
    ? savedFurthest
    : savedPosition + config.frozenAhead;
  const frozenUntil = items.length === 0 ? 0 : Math.min(items.length - 1, frozenEnd);
  return {
    session: {
      sessionId: existing && existing.sessionId ? existing.sessionId : randomUUID(),
      userId: userId || (existing && existing.userId) || null,
      items,
      position: savedPosition,
      maxPosition: savedFurthest,
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
 * Return the stored list when the tail is already full and the profile
 * has not changed, or the rebuild interval has not elapsed.
 * @param {object|null} session
 * @param {number|undefined} position
 * @param {number} limit
 * @param {number} profileVersion
 * @param {Date} now
 * @returns {object|null}
 */
const reuseStoredSession = (session, position, limit, profileVersion, now) => {
  if (!session || !Array.isArray(session.items) || session.items.length === 0) return null;
  const items = session.items;
  const reached = reachedPosition(session, position, items.length);
  const prefixLength = prefixLengthFor(items.length, reached.safe, reached.furthest);
  const tailLength = items.length - prefixLength;
  const size = limit || config.feedBatchSize;
  if (tailLength < size) return null;

  const storedVersion = Number.isInteger(session.builtWithProfileVersion)
    ? session.builtWithProfileVersion
    : 0;
  if (storedVersion !== profileVersion) {
    const last = session.lastRebuildAt ? new Date(session.lastRebuildAt).getTime() : 0;
    const elapsed = now.getTime() - last;
    if (!last || elapsed >= config.feedRebuildMinIntervalSeconds * 1000) return null;
  }

  return {
    sessionId: session.sessionId,
    frozenUntil: Math.min(
      items.length - 1,
      reached.safe < reached.furthest ? reached.furthest : reached.safe + config.frozenAhead
    ),
    items,
  };
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
    const profileVersion = Number.isInteger(input.profileVersion) ? input.profileVersion : 0;
    const limit = input.limit || config.feedBatchSize;
    const raised = rememberPosition(base, input.position);
    const reused = reuseStoredSession(base, input.position, limit, profileVersion, clock);
    if (reused) {
      if (raised) await sessions.save(base);
      return reused;
    }
    const preview = composeSession(base, input.position, [], userId, clock);
    const prefix = preview.items;
    const built = await input.build({
      exclude: new Set(prefix.map((item) => item.shortId)),
      prefixLength: prefix.length,
      prefixTail: prefix.length ? prefix[prefix.length - 1] : null,
      carried: carriedBlock(prefix, prefix.length),
    });
    const fresh = !base && input.focusItem ? placeFocus(built || [], input.focusItem) : built;
    const composed = composeSession(
      base || { sessionId: preview.session.sessionId, userId, items: [] },
      input.position,
      fresh,
      userId,
      clock
    );
    if (!owned && input.sessionId && existing) {
      composed.session.sessionId = randomUUID();
    }
    composed.session.builtWithProfileVersion = profileVersion;
    composed.session.lastRebuildAt = clock;
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
  reuseStoredSession,
  placeFocus,
  rememberPosition,
  createFeedSessionService,
};
