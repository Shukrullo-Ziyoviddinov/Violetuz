const clipService = require('../services/clip.service');
const { sendSuccess } = require('../utils/response');
const { attachDocLikeCounts } = require('../utils/reactionCounts');

const getClips = async (req, res) => {
  const { categoryNameMusic, artistId, type, search } = req.query;
  const items = await clipService.getAll({ categoryNameMusic, artistId, type, search });

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getClipById = async (req, res) => {
  const clip = await clipService.getById(req.params.id);
  const data = await attachDocLikeCounts('klip', clip, req.authUser?._id);
  sendSuccess(res, { data });
};

const getClipsByCategory = async (req, res) => {
  const items = await clipService.getByCategory(req.params.categoryNameMusic);
  sendSuccess(res, {
    categoryNameMusic: req.params.categoryNameMusic,
    count: items.length,
    data: items,
  });
};

const getClipsByArtist = async (req, res) => {
  const items = await clipService.getByArtist(req.params.artistId);
  sendSuccess(res, {
    artistId: req.params.artistId,
    count: items.length,
    data: items,
  });
};

module.exports = {
  getClips,
  getClipById,
  getClipsByCategory,
  getClipsByArtist,
};
