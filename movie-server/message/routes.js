'use strict';

const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { requireAuth } = require('../middleware/auth.middleware');
const { sendSuccess } = require('../utils/response');
const { toMessageSelf } = require('./self');

/**
 * Xabarlar. Base: /api/messages
 * Hozircha faqat kirgan odamning o‘z kartasi.
 */
const router = Router();

router.use(requireAuth);

router.get('/me', asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: toMessageSelf(req.authUser) });
}));

module.exports = router;
