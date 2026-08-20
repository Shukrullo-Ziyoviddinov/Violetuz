const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const viewService = require('../services/view.service');

const getCount = asyncHandler(async (req, res) => {
  const result = await viewService.getViewCount({
    id: req.query?.id,
    type: req.query?.type,
  });
  return sendSuccess(res, { data: result });
});

const recordView = asyncHandler(async (req, res) => {
  const result = await viewService.recordView(req.authUser._id, {
    id: req.body?.id,
    type: req.body?.type,
  });
  return sendSuccess(res, { data: result }, result.recorded ? 201 : 200);
});

module.exports = {
  getCount,
  recordView,
};
