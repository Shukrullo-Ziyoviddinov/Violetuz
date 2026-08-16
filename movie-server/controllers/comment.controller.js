const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const commentService = require('../services/comment.service');

const listComments = asyncHandler(async (req, res) => {
  const viewerId = req.authUser?._id || null;
  const comments = await commentService.listComments(
    {
      targetType: req.query.targetType,
      targetId: req.query.targetId,
    },
    viewerId
  );
  return sendSuccess(res, { data: { comments } });
});

const createComment = asyncHandler(async (req, res) => {
  const item = await commentService.createComment(req.authUser._id, {
    targetType: req.body?.targetType,
    targetId: req.body?.targetId ?? req.body?.id,
    text: req.body?.text,
    parentId: req.body?.parentId ?? null,
  });
  return sendSuccess(res, { data: { item } }, 201);
});

const updateComment = asyncHandler(async (req, res) => {
  const item = await commentService.updateComment(req.authUser._id, req.params.id, {
    text: req.body?.text,
  });
  return sendSuccess(res, { data: { item } });
});

const deleteComment = asyncHandler(async (req, res) => {
  const result = await commentService.deleteComment(req.authUser._id, req.params.id);
  return sendSuccess(res, { data: result });
});

const toggleLike = asyncHandler(async (req, res) => {
  const result = await commentService.toggleLike(req.authUser._id, req.params.id);
  return sendSuccess(res, { data: result });
});

const listHistory = asyncHandler(async (req, res) => {
  const history = await commentService.listMyHistory(req.authUser._id);
  return sendSuccess(res, { data: { history } });
});

const listLikedIds = asyncHandler(async (req, res) => {
  const likedIds = await commentService.listLikedIds(req.authUser._id, {
    targetType: req.query.targetType,
    targetId: req.query.targetId,
  });
  return sendSuccess(res, { data: { likedIds } });
});

module.exports = {
  listComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike,
  listHistory,
  listLikedIds,
};
