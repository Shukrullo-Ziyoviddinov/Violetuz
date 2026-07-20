const musicService = require('../services/music.service');
const { sendSuccess } = require('../utils/response');

const getMusicList = async (req, res) => {
  const { categoryNameMusic, artistId, search } = req.query;
  const items = await musicService.getAll({ categoryNameMusic, artistId, search });

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getMusicById = async (req, res) => {
  const music = await musicService.getById(req.params.id);
  sendSuccess(res, { data: music });
};

const getMusicByCategory = async (req, res) => {
  const items = await musicService.getByCategory(req.params.categoryNameMusic);
  sendSuccess(res, {
    categoryNameMusic: req.params.categoryNameMusic,
    count: items.length,
    data: items,
  });
};

const getMusicByArtist = async (req, res) => {
  const items = await musicService.getByArtist(req.params.artistId);
  sendSuccess(res, {
    artistId: req.params.artistId,
    count: items.length,
    data: items,
  });
};

module.exports = {
  getMusicList,
  getMusicById,
  getMusicByCategory,
  getMusicByArtist,
};
