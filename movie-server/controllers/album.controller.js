const albumService = require('../services/album.service');
const { sendSuccess } = require('../utils/response');

const getAlbums = async (req, res) => {
  const { categoryNameMusic, artistId, search } = req.query;
  const items = await albumService.getAll({ categoryNameMusic, artistId, search });

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getAlbumById = async (req, res) => {
  const album = await albumService.getById(req.params.id);
  sendSuccess(res, { data: album });
};

const getAlbumsByCategory = async (req, res) => {
  const items = await albumService.getByCategory(req.params.categoryNameMusic);
  sendSuccess(res, {
    categoryNameMusic: req.params.categoryNameMusic,
    count: items.length,
    data: items,
  });
};

const getAlbumsByArtist = async (req, res) => {
  const items = await albumService.getByArtist(req.params.artistId);
  sendSuccess(res, {
    artistId: req.params.artistId,
    count: items.length,
    data: items,
  });
};

module.exports = {
  getAlbums,
  getAlbumById,
  getAlbumsByCategory,
  getAlbumsByArtist,
};
