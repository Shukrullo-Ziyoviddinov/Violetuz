const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const followingService = require('../services/following.service');

const listFollowing = asyncHandler(async (req, res) => {
  const items = await followingService.listFollowing(req.authUser._id, {
    type: req.query.type,
  });
  return sendSuccess(res, { data: { items } });
});

const replaceFollowing = asyncHandler(async (req, res) => {
  const items = await followingService.replaceFollowing(
    req.authUser._id,
    req.body?.items
  );
  return sendSuccess(res, { data: { items } });
});

const addFollow = asyncHandler(async (req, res) => {
  const item = await followingService.addFollow(req.authUser._id, {
    id: req.body?.id,
    type: req.body?.type,
  });
  return sendSuccess(res, { data: { item } }, 201);
});

const removeFollow = asyncHandler(async (req, res) => {
  const item = await followingService.removeFollow(req.authUser._id, {
    id: req.body?.id ?? req.query?.id,
    type: req.body?.type ?? req.query?.type,
  });
  return sendSuccess(res, { data: { item } });
});

const toggleFollow = asyncHandler(async (req, res) => {
  const result = await followingService.toggleFollow(req.authUser._id, {
    id: req.body?.id,
    type: req.body?.type,
  });
  return sendSuccess(res, { data: result });
});

module.exports = {
  listFollowing,
  replaceFollowing,
  addFollow,
  removeFollow,
  toggleFollow,
};
