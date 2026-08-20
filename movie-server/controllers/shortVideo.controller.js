const shortVideoService = require('../services/shortVideo.service');
const { sendSuccess } = require('../utils/response');
const { attachDocSaveCount, attachDocsSaveCount } = require('../utils/wishlistCounts');
const { attachDocRepostCount, attachDocsRepostCount } = require('../utils/repostCounts');
const { attachDocShareCount, attachDocsShareCount } = require('../utils/shareCounts');

const attachShortsSocial = async (type, docs, userId) => {
  const withSaves = await attachDocsSaveCount(type, docs, userId);
  const withReposts = await attachDocsRepostCount(type, withSaves, userId);
  return attachDocsShareCount(type, withReposts);
};

const attachShortSocial = async (type, doc, userId) => {
  const withSave = await attachDocSaveCount(type, doc, userId);
  const withRepost = await attachDocRepostCount(type, withSave, userId);
  return attachDocShareCount(type, withRepost);
};

const getShorts = async (req, res) => {
  const { movieId, type } = req.query;
  const items = await shortVideoService.getAll({ movieId, type });
  const data = await attachShortsSocial('movieShorts', items, req.authUser?._id);

  sendSuccess(res, {
    count: data.length,
    data,
  });
};

const getShortById = async (req, res) => {
  const item = await shortVideoService.getById(req.params.id);
  const data = await attachShortSocial('movieShorts', item, req.authUser?._id);
  sendSuccess(res, { data });
};

const getShortsByMovieId = async (req, res) => {
  const items = await shortVideoService.getByMovieId(req.params.movieId);
  const data = await attachShortsSocial('movieShorts', items, req.authUser?._id);
  sendSuccess(res, {
    movieId: Number(req.params.movieId),
    count: data.length,
    data,
  });
};

module.exports = {
  getShorts,
  getShortById,
  getShortsByMovieId,
};
