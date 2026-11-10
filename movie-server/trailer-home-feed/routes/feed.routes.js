'use strict';
const { Router } = require('express');
const { createFeedPagination } = require('../services/feedPagination');
const { rateLimit } = require('express-rate-limit');
const { requireAuth } = require('../../middleware/auth.middleware');
const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { badRequest } = require('../../utils/errors');
const { rankAccountTrailerFeed, rankGuestTrailerFeed } = require('../services/finalRanking.service');
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');

// Only presentation fields leave the server; taste, scores and video sources stay private.
const present = (result) => ({ generatedAt: result.generatedAt, nextCursor: result.nextCursor ?? null, items: result.items.map((item) => ({
  key: item.key, movieId: item.movieId, trailerId: item.trailerId, id: item.trailerId,
  title: item.title, movieTitle: item.movieTitle, trillerimg: item.trillerimg,
})) });

// offset/limit only cut an already ranked page. rank() still receives feed.size.
const windowValue = (value) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw == null || raw === '') return null;
  if (typeof raw !== 'string' || !/^\d{1,2}$/.test(raw)) throw badRequest('Invalid trailer feed window');
  const number = Number(raw);
  if (number > trailerHomeFeedWeights.feed.size) throw badRequest('Invalid trailer feed window');
  return number;
};

const sendPage = (res, full, query) => {
  const view = present(full);
  const pageCursor = full.pageCursor || null;
  const limit = windowValue(query.limit);
  if (limit == null) {
    sendSuccess(res, { data: { ...view, pageCursor } });
    return;
  }
  const offset = windowValue(query.offset) ?? 0;
  const items = view.items.slice(offset, offset + limit);
  sendSuccess(res, { data: {
    generatedAt: view.generatedAt, nextCursor: view.nextCursor, pageCursor, items,
    hasMore: offset + items.length < view.items.length, nextOffset: offset + items.length,
  } });
};

const createFeedRouter = ({ account = rankAccountTrailerFeed, guest = rankGuestTrailerFeed,
  authenticate = requireAuth } = {}) => {
  const router = Router();
  const paginate = createFeedPagination();
  router.use(rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }));
  router.use((req, res, next) => { res.set('Cache-Control', 'private, no-store'); next(); });
  router.get('/', authenticate, asyncHandler(async (req, res) => {
    sendPage(res, await paginate({ cursor: req.query.cursor, scope: `account:${req.authUser._id}`,
      rank: (options) => account(req.authUser._id, options) }), req.query);
  }));
  router.post('/guest', asyncHandler(async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw badRequest('Invalid guest history');
    const history = {};
    const policy = trailerHomeFeedWeights.personalization;
    for (const [key, max] of [['sessions', policy.maxGuestSessions], ['actions', policy.maxGuestActions],
      ['movieHistory', policy.maxGuestMovieHistory]]) {
      const rows = body[key] === undefined ? [] : body[key];
      if (!Array.isArray(rows) || rows.length > max) throw badRequest('Invalid guest history');
      history[key] = rows;
    }
    sendPage(res, await paginate({ cursor: req.query.cursor, scope: 'guest',
      rank: (options) => guest(history, options) }), req.query);
  }));
  return router;
};
module.exports = { createFeedRouter, present };
