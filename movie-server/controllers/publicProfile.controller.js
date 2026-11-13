const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const publicProfileService = require('../services/publicProfile.service');
const { buildUserSharePage } = require('../utils/userSharePage');

const getPublicProfile = asyncHandler(async (req, res) => {
  const profile = await publicProfileService.getPublicProfile(req.params.id);
  return sendSuccess(res, { data: profile });
});

const getPublicProfileShare = asyncHandler(async (req, res) => {
  const user = await publicProfileService.getPublicUserCard(req.params.id);
  const baseUrl = process.env.PUBLIC_SITE_URL || 'https://www.violetplay.uz';
  res.status(200).type('html').send(buildUserSharePage(user, baseUrl));
});

module.exports = {
  getPublicProfile,
  getPublicProfileShare,
};
