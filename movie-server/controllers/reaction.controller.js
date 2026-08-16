const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const reactionService = require('../services/reaction.service');

const listReactions = asyncHandler(async (req, res) => {
  const items = await reactionService.listReactions(req.authUser._id, {
    type: req.query.type,
  });
  return sendSuccess(res, { data: { items } });
});

const listLikeHistory = asyncHandler(async (req, res) => {
  const history = await reactionService.listLikeHistory(req.authUser._id);
  return sendSuccess(res, { data: { history } });
});

const replaceReactions = asyncHandler(async (req, res) => {
  const data = await reactionService.replaceReactions(
    req.authUser._id,
    req.body?.items
  );
  return sendSuccess(res, { data });
});

const setReaction = asyncHandler(async (req, res) => {
  const result = await reactionService.setReaction(req.authUser._id, {
    id: req.body?.id,
    type: req.body?.type,
    value: req.body?.value,
  });
  return sendSuccess(res, { data: result });
});

const toggleShortsLike = asyncHandler(async (req, res) => {
  const result = await reactionService.toggleShortsLike(req.authUser._id, {
    id: req.body?.id,
  });
  return sendSuccess(res, { data: result });
});

module.exports = {
  listReactions,
  listLikeHistory,
  replaceReactions,
  setReaction,
  toggleShortsLike,
};
