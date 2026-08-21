const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const shortDownloadService = require('../services/shortDownload.service');

const getCount = asyncHandler(async (req, res) => {
  const result = await shortDownloadService.getDownloadCount({
    id: req.query?.id,
    type: req.query?.type,
  });
  return sendSuccess(res, { data: result });
});

const recordDownload = asyncHandler(async (req, res) => {
  const userId = req.authUser?._id || null;
  const result = await shortDownloadService.recordDownload(userId, {
    id: req.body?.id,
    type: req.body?.type,
  });
  return sendSuccess(res, { data: result }, 201);
});

module.exports = {
  getCount,
  recordDownload,
};
