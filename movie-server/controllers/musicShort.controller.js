const musicShortService = require('../services/musicShort.service');
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

const getMusicShorts = async (req, res) => {
  const { contentType, artistId, musicId, movieId } = req.query;
  const items = await musicShortService.getAll({ contentType, artistId, musicId, movieId });
  const data = await attachShortsSocial('musicshorts', items, req.authUser?._id);

  sendSuccess(res, {
    count: data.length,
    data,
  });
};

const getMusicShortById = async (req, res) => {
  const item = await musicShortService.getById(req.params.id);
  const data = await attachShortSocial('musicshorts', item, req.authUser?._id);
  sendSuccess(res, { data });
};

const getMusicShortsByArtist = async (req, res) => {
  const items = await musicShortService.getByArtistId(req.params.artistId);
  const data = await attachShortsSocial('musicshorts', items, req.authUser?._id);
  sendSuccess(res, {
    artistId: req.params.artistId,
    count: data.length,
    data,
  });
};

module.exports = {
  getMusicShorts,
  getMusicShortById,
  getMusicShortsByArtist,
};
