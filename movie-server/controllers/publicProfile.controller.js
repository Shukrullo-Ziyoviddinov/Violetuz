const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const publicProfileService = require('../services/publicProfile.service');

const getPublicProfile = asyncHandler(async (req, res) => {
  const profile = await publicProfileService.getPublicProfile(req.params.id);
  return sendSuccess(res, { data: profile });
});

module.exports = {
  getPublicProfile,
};
