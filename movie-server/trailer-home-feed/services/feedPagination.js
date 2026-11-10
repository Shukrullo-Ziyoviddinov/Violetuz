'use strict';
const { randomBytes } = require('crypto');
const { createHttpError, badRequest } = require('../../utils/errors');
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');

// One ordering session serves Home and its continuation. No taste/history is cached.
const createFeedPagination = ({ now = Date.now, maxSessions = 256 } = {}) => {
  const sessions = new Map();
  const pageSize = trailerHomeFeedWeights.feed.size;
  return async ({ cursor, scope, rank }) => {
    const time = now();
    for (const [id, session] of sessions) if (session.expiresAt <= time) sessions.delete(id);
    let id;
    let page = 0;
    let session;
    if (cursor !== undefined) {
      if (typeof cursor !== 'string' || !/^[a-f0-9]{48}:\d{1,6}$/.test(cursor)) throw badRequest('Invalid trailer feed cursor');
      [id] = cursor.split(':');
      page = Number(cursor.split(':')[1]);
      session = sessions.get(id);
      if (!session || session.scope !== scope) throw createHttpError(410, 'Trailer feed expired; refresh recommendations');
      if (page > session.pages.length || (page === session.pages.length && session.done)) throw badRequest('Invalid trailer feed page');
    } else {
      while (sessions.size >= maxSessions) sessions.delete(sessions.keys().next().value);
      id = randomBytes(24).toString('hex');
      session = { scope, seed: randomBytes(24).toString('hex'), expiresAt: time + trailerHomeFeedWeights.feed.sessionTtlMs,
        pages: [], seen: new Set(), tail: [], done: false, pending: null };
      sessions.set(id, session);
    }
    if (page < session.pages.length) return session.pages[page];
    // Coalesce overlapping/retried requests so they cannot consume two pages.
    if (!session.pending) {
      session.pending = (async () => {
        const result = await rank({ sessionSeed: session.seed, excludeKeys: [...session.seen], previousItems: session.tail, limit: pageSize });
        const items = result.items.filter((item) => {
          if (session.seen.has(item.key)) return false;
          session.seen.add(item.key);
          return true;
        });
        session.tail = [...session.tail, ...items].slice(-(trailerHomeFeedWeights.diversity.windowSize - 1));
        session.done = items.length < pageSize;
        const pageIndex = session.pages.length;
        const response = { ...result, items,
          nextCursor: session.done ? null : `${id}:${pageIndex + 1}`,
          pageCursor: `${id}:${pageIndex}` };
        session.pages.push(response);
        return response;
      })().finally(() => { session.pending = null; });
    }
    return session.pending;
  };
};
module.exports = { createFeedPagination };
