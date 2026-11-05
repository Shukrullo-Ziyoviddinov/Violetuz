'use strict';
const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');
const { createGuestIdentity, GUEST_COOKIE } = require('../guest/guestIdentity');
const { createProgressService } = require('../services/progress.service');
const { JWT_SECRET, NODE_ENV, ALLOWED_ORIGINS } = require('../../config/env');
const { AUTH_COOKIE_NAME } = require('../../utils/authCookie');
const { badRequest } = require('../../utils/errors');
const { sendSuccess } = require('../../utils/response');
const asyncHandler = require('../../middleware/asyncHandler');
const { validateProgressReport } = require('../progress/progressProtocol');

const createGuestProgressRouter = ({ identity = createGuestIdentity({ secret: JWT_SECRET }), progressService,
  movieModel = require('../../models/Movie.model'), origins = ALLOWED_ORIGINS } = {}) => {
  const service = progressService || createProgressService({ movieModel,
    progressModel: require('../models/GuestTrailerProgressSession.model') });
  const router = Router();
  router.use(rateLimit({ windowMs: 60000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }));
  router.use((req, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    if (req.cookies?.[AUTH_COOKIE_NAME] || req.headers.authorization) return res.status(409).json({ success: false, message: 'Guest reporting requires signed-out playback' });
    if (req.get('origin') && !origins.includes(req.get('origin'))) return res.status(403).json({ success: false, message: 'Origin not allowed' });
    req.trailerGuestId = identity.read(req.cookies?.[GUEST_COOKIE]);
    next();
  });
  const identityLimit = rateLimit({ windowMs: 3600000, limit: 10, skip: (req) => Boolean(req.trailerGuestId),
    standardHeaders: 'draft-8', legacyHeaders: false });
  const viewerLimit = rateLimit({ windowMs: 60000, limit: 120, keyGenerator: (req) => req.trailerGuestId,
    standardHeaders: 'draft-8', legacyHeaders: false });
  router.post('/session', identityLimit, asyncHandler(async (req, res) => {
    // Validate identity/duration and catalog membership before issuing any ticket.
    let report;
    try { report = validateProgressReport({ ...req.body, intervals: [], realWatchedSeconds: 0, totalPlayedSeconds: 0 }); }
    catch (error) { throw badRequest(error.message); }
    const exists = await movieModel.findOne({ id: report.movieId, 'trailersVideo.id': report.trailerId }).select({ id: 1 }).lean();
    if (!exists) throw badRequest('Movie trailer not found');
    if (!req.trailerGuestId) {
      const issued = identity.issue();
      req.trailerGuestId = issued.guestId;
      res.cookie(GUEST_COOKIE, issued.token, { httpOnly: true, secure: NODE_ENV === 'production',
        sameSite: NODE_ENV === 'production' ? 'none' : 'lax', path: '/', maxAge: 180 * 86400000 });
    }
    sendSuccess(res, { data: { ticket: identity.start(req.trailerGuestId, report) } });
  }));
  router.post('/', (req, res, next) => {
    if (!req.trailerGuestId) return next(badRequest('Valid guest cookie required'));
    return viewerLimit(req, res, next);
  }, asyncHandler(async (req, res) => {
    const report = identity.validate(req.trailerGuestId, req.body);
    sendSuccess(res, { data: await service.report(req.trailerGuestId, report) });
  }));
  return router;
};
module.exports = { createGuestProgressRouter };
