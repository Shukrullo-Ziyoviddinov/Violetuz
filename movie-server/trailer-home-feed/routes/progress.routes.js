'use strict';
const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');
const { requireAuth } = require('../../middleware/auth.middleware');
const asyncHandler = require('../../middleware/asyncHandler');
const { badRequest } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/response');
const { createProgressService } = require('../services/progress.service');
const service = createProgressService({
  movieModel: require('../../models/Movie.model'),
  progressModel: require('../models/TrailerProgressSession.model'),
});
const createProgressRouter = ({ authenticate = requireAuth, progressService = service } = {}) => {
  const router = Router();
  router.use(authenticate);
  router.use(rateLimit({ windowMs: 60_000, limit: 120, keyGenerator: (req) => String(req.authUser._id),
    standardHeaders: 'draft-8', legacyHeaders: false }));
  router.post('/', asyncHandler(async (req, res) => {
    // A different tab may have changed the session cookie since the snapshot was queued.
    if (req.body?.expectedAccountId !== undefined && req.body.expectedAccountId !== String(req.authUser._id)) {
      throw badRequest('Trailer progress account does not match the current session');
    }
    sendSuccess(res, { data: await progressService.report(req.authUser._id, req.body) });
  }));
  router.get('/:movieId/:trailerId', asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await progressService.read(req.authUser._id, req.params.movieId, req.params.trailerId) });
  }));
  return router;
};
module.exports = createProgressRouter();
module.exports.createProgressRouter = createProgressRouter;
