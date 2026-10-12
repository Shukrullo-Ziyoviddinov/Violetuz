/**
 * GET  /api/detail-recommend?type=&id=     login bo'lsa ContentView, yo'q bo'lsa tarixsiz
 * POST /api/detail-recommend/guest        mehmon localHistory, yozuv yo'q
 *
 * Faqat detailRecommend.js. music-similar va home-feed route lariga ulanmaydi.
 *
 * @module detail-recommend/routes
 */

'use strict';

const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../../middleware/asyncHandler');
const { optionalAuth } = require('../../middleware/auth.middleware');
const { sendSuccess, sendError } = require('../../utils/response');
const { buildDetailRecommend } = require('../detailRecommend');

const router = Router();

const guestDetailRecommendRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many detail recommend requests, try again later',
  },
});

/**
 * @param {Object|null|undefined} source
 * @returns {{ pageType: unknown, pageId: unknown }}
 */
const readPage = (source) => ({
  pageType: source?.pageType ?? source?.type,
  pageId: source?.id ?? source?.pageId,
});

router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { pageType, pageId } = readPage(req.query);
    const result = await buildDetailRecommend({
      pageType,
      pageId,
      userId: req.authUser?._id || null,
    });
    if (!result) return sendError(res, 'Sahifa topilmadi', 404);
    return sendSuccess(res, { data: result });
  })
);

router.post(
  '/guest',
  guestDetailRecommendRateLimit,
  asyncHandler(async (req, res) => {
    const { pageType, pageId } = readPage(req.body);
    const result = await buildDetailRecommend({
      pageType,
      pageId,
      localHistory: req.body?.localHistory,
    });
    if (!result) return sendError(res, 'Sahifa topilmadi', 404);
    return sendSuccess(res, { data: result });
  })
);

module.exports = router;
