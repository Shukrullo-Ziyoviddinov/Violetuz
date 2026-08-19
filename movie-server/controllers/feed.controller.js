const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const feedService = require('../services/feed.service');

const listFeed = asyncHandler(async (req, res) => {
  const userId = req.authUser?._id || null;
  const data = await feedService.listFeed(userId, req.query);
  return sendSuccess(res, { data });
});

module.exports = {
  listFeed,
};
