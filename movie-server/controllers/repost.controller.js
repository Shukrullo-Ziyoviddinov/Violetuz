const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const repostService = require('../services/repost.service');

const listReposts = asyncHandler(async (req, res) => {
  const items = await repostService.listReposts(req.authUser._id, {
    type: req.query.type,
  });
  return sendSuccess(res, { data: { items } });
});

const listRepostIds = asyncHandler(async (req, res) => {
  const items = await repostService.listRepostIds(req.authUser._id, {
    type: req.query.type,
  });
  return sendSuccess(res, { data: { items } });
});

const replaceReposts = asyncHandler(async (req, res) => {
  const items = await repostService.replaceReposts(
    req.authUser._id,
    req.body?.items
  );
  return sendSuccess(res, { data: { items } });
});

const addItem = asyncHandler(async (req, res) => {
  const item = await repostService.addItem(req.authUser._id, {
    id: req.body?.id,
    type: req.body?.type,
  });
  return sendSuccess(res, { data: { item } }, 201);
});

const removeItem = asyncHandler(async (req, res) => {
  const item = await repostService.removeItem(req.authUser._id, {
    id: req.body?.id ?? req.query?.id,
    type: req.body?.type ?? req.query?.type,
  });
  return sendSuccess(res, { data: { item } });
});

const toggleItem = asyncHandler(async (req, res) => {
  const result = await repostService.toggleItem(req.authUser._id, {
    id: req.body?.id,
    type: req.body?.type,
  });
  return sendSuccess(res, { data: result });
});

module.exports = {
  listReposts,
  listRepostIds,
  replaceReposts,
  addItem,
  removeItem,
  toggleItem,
};
