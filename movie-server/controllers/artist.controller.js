const artistService = require('../services/artist.service');
const { sendSuccess } = require('../utils/response');

const getArtists = async (_req, res) => {
  const items = await artistService.getAll();
  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getArtistById = async (req, res) => {
  const item = await artistService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

module.exports = {
  getArtists,
  getArtistById,
};
