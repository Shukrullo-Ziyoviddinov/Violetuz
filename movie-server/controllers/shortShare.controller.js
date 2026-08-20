const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const shortShareService = require('../services/shortShare.service');

const recordShare = asyncHandler(async (req, res) => {
  const result = await shortShareService.recordShare(req.authUser._id, {
    id: req.body?.id,
    type: req.body?.type,
    channel: req.body?.channel,
  });
  return sendSuccess(res, { data: result }, 201);
});

module.exports = {
  recordShare,
};
