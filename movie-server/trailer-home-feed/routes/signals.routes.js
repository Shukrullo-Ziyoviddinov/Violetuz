'use strict';
const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');
const { requireAuth } = require('../../middleware/auth.middleware');
const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');
const { createSignalsService } = require('../services/signals.service');

const service = createSignalsService({
  movieModel: require('../../models/Movie.model'),
  actionModel: require('../models/TrailerSignalAction.model'),
  reactionModel: require('../../models/UserReaction.model'),
  progressModel: require('../models/TrailerProgressSession.model'),
});
const router = Router();
router.use(requireAuth);
router.use(rateLimit({ windowMs: 60_000, limit: trailerHomeFeedWeights.engagement.collection.accountRequestsPerMinute,
  keyGenerator: (req) => String(req.authUser._id), standardHeaders: 'draft-8', legacyHeaders: false }));
router.post('/', asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.report(req.authUser._id, req.body) });
}));
router.get('/:movieId/:trailerId', asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.read(req.authUser._id, req.params) });
}));
module.exports = router;
