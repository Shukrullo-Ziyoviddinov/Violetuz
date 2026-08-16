const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const wishlistService = require('../services/wishlist.service');

const listWishlist = asyncHandler(async (req, res) => {
  const items = await wishlistService.listWishlist(req.authUser._id, {
    type: req.query.type,
  });
  return sendSuccess(res, { data: { items } });
});

const replaceWishlist = asyncHandler(async (req, res) => {
  const items = await wishlistService.replaceWishlist(
    req.authUser._id,
    req.body?.items
  );
  return sendSuccess(res, { data: { items } });
});

const addItem = asyncHandler(async (req, res) => {
  const item = await wishlistService.addItem(req.authUser._id, {
    id: req.body?.id,
    type: req.body?.type,
  });
  return sendSuccess(res, { data: { item } }, 201);
});

const removeItem = asyncHandler(async (req, res) => {
  const item = await wishlistService.removeItem(req.authUser._id, {
    id: req.body?.id ?? req.query?.id,
    type: req.body?.type ?? req.query?.type,
  });
  return sendSuccess(res, { data: { item } });
});

const toggleItem = asyncHandler(async (req, res) => {
  const result = await wishlistService.toggleItem(req.authUser._id, {
    id: req.body?.id,
    type: req.body?.type,
  });
  return sendSuccess(res, { data: result });
});

module.exports = {
  listWishlist,
  replaceWishlist,
  addItem,
  removeItem,
  toggleItem,
};
