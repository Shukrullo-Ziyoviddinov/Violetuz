const musicShortService = require('../services/musicShort.service');
const { sendSuccess } = require('../utils/response');
const { attachDocSaveCount, attachDocsSaveCount } = require('../utils/wishlistCounts');

const getMusicShorts = async (req, res) => {
  const { contentType, artistId, musicId, movieId } = req.query;
  const items = await musicShortService.getAll({ contentType, artistId, musicId, movieId });
  const data = await attachDocsSaveCount('musicshorts', items, req.authUser?._id);

  sendSuccess(res, {
    count: data.length,
    data,
  });
};

const getMusicShortById = async (req, res) => {
  const item = await musicShortService.getById(req.params.id);
  const data = await attachDocSaveCount('musicshorts', item, req.authUser?._id);
  sendSuccess(res, { data });
};

const getMusicShortsByArtist = async (req, res) => {
  const items = await musicShortService.getByArtistId(req.params.artistId);
  const data = await attachDocsSaveCount('musicshorts', items, req.authUser?._id);
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
