const musicShortService = require('../services/musicShort.service');
const { sendSuccess } = require('../utils/response');

const getMusicShorts = async (req, res) => {
  const { contentType, artistId, musicId, movieId } = req.query;
  const items = await musicShortService.getAll({ contentType, artistId, musicId, movieId });

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getMusicShortById = async (req, res) => {
  const item = await musicShortService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

const getMusicShortsByArtist = async (req, res) => {
  const items = await musicShortService.getByArtistId(req.params.artistId);
  sendSuccess(res, {
    artistId: req.params.artistId,
    count: items.length,
    data: items,
  });
};

module.exports = {
  getMusicShorts,
  getMusicShortById,
  getMusicShortsByArtist,
};
