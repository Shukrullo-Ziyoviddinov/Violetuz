/**
 * GET /api/home-feed
 * userId cookie sessiyadan. Query dagi userId o'qilmaydi.
 *
 * @module home-feed/controllers/login.controller
 */

'use strict';

const asyncHandler = require('../../middleware/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { getLoginHomeFeed, getLoginHomeFeedPage } = require('../services/loginFeed.service');

const parsePage = (source) => {
  const limitRaw = source?.limit;
  if (limitRaw == null || limitRaw === '') return null;
  const limit = Math.min(40, Math.max(1, parseInt(limitRaw, 10) || 10));
  const offset = Math.max(0, parseInt(source?.offset, 10) || 0);
  const excludeRaw = source?.exclude;
  const excludeIds = Array.isArray(excludeRaw)
    ? excludeRaw
    : String(excludeRaw || '').split(',');
  const genre = String(source?.genre || '').trim();
  return {
    limit,
    offset,
    excludeIds: excludeIds.map((id) => String(id).trim()).filter(Boolean),
    genre: genre === 'all' ? '' : genre,
  };
};

const getLoginHomeFeedHandler = asyncHandler(async (req, res) => {
  const page = parsePage(req.query);
  const result = page
    ? await getLoginHomeFeedPage(req.authUser._id, page)
    : await getLoginHomeFeed(req.authUser._id);
  return sendSuccess(res, { data: result });
});

module.exports = {
  getLoginHomeFeedHandler,
};
