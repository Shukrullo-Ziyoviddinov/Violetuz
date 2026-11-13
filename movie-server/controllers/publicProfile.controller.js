const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const publicProfileService = require('../services/publicProfile.service');
const { buildUserSharePage } = require('../utils/userSharePage');
const { renderShareAvatar } = require('../utils/userShareImage');

const siteUrl = () => process.env.PUBLIC_SITE_URL || 'https://www.violetplay.uz';

const getPublicProfile = asyncHandler(async (req, res) => {
  const profile = await publicProfileService.getPublicProfile(req.params.id);
  return sendSuccess(res, { data: profile });
});

const getPublicProfileShare = asyncHandler(async (req, res) => {
  const user = await publicProfileService.getPublicUserCard(req.params.id);
  res.status(200).type('html').send(buildUserSharePage(user, siteUrl()));
});

const getPublicProfileShareImage = asyncHandler(async (req, res) => {
  const user = await publicProfileService.getPublicUserCard(req.params.id);
  const jpeg = await renderShareAvatar(user.avatar, siteUrl());
  if (!jpeg) {
    res.status(404).end();
    return;
  }
  res.set('Content-Type', 'image/jpeg');
  res.set('Cache-Control', 'public, max-age=86400');
  res.status(200).send(jpeg);
});

module.exports = {
  getPublicProfile,
  getPublicProfileShare,
  getPublicProfileShareImage,
};
