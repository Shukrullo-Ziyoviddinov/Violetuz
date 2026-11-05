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

const createFeedRouter = ({ account = rankAccountTrailerFeed, guest = rankGuestTrailerFeed,
  authenticate = requireAuth } = {}) => {
  const router = Router();
  const paginate = createFeedPagination();
  router.use(rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }));
  router.use((req, res, next) => { res.set('Cache-Control', 'private, no-store'); next(); });
  router.get('/', authenticate, asyncHandler(async (req, res) => {
    sendSuccess(res, { data: present(await paginate({ cursor: req.query.cursor, scope: `account:${req.authUser._id}`,
      rank: (options) => account(req.authUser._id, options) })) });
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
    sendSuccess(res, { data: present(await paginate({ cursor: req.query.cursor, scope: 'guest',
      rank: (options) => guest(history, options) })) });
  }));
  return router;
};
module.exports = { createFeedRouter, present };
