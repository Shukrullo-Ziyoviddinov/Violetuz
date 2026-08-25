const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const searchPoiscHistoryService = require('../services/searchPoiscHistory.service');

/**
 * GET — foydalanuvchi qidiruv click tarixi.
 * Query: ?limit=20 (ixtiyoriy)
 */
const listHistory = asyncHandler(async (req, res) => {
  const items = await searchPoiscHistoryService.listHistory(req.authUser._id, {
    limit: req.query.limit,
  });
  return sendSuccess(res, { data: { items } });
});

/**
 * POST — search natijasidan click yozish.
 * Body: { id, type } — query matni yuborilmaydi / saqlanmaydi.
 */
const recordClick = asyncHandler(async (req, res) => {
  const item = await searchPoiscHistoryService.recordClick(req.authUser._id, {
    id: req.body?.id,
    type: req.body?.type,
  });
  return sendSuccess(res, { data: { item } }, 201);
});

/**
 * DELETE — bitta yozuv.
 * Body yoki query: { id, type }
 */
const removeItem = asyncHandler(async (req, res) => {
  const item = await searchPoiscHistoryService.removeItem(req.authUser._id, {
    id: req.body?.id ?? req.query?.id,
    type: req.body?.type ?? req.query?.type,
  });
  return sendSuccess(res, { data: { item } });
});

/**
 * DELETE /all — barcha tarix.
 */
const clearHistory = asyncHandler(async (req, res) => {
  const result = await searchPoiscHistoryService.clearHistory(req.authUser._id);
  return sendSuccess(res, { data: result });
});

module.exports = {
  listHistory,
  recordClick,
  removeItem,
  clearHistory,
};
