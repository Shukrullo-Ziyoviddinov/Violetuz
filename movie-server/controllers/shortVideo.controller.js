const shortVideoService = require('../services/shortVideo.service');
const { sendSuccess } = require('../utils/response');

const getShorts = async (req, res) => {
  const { movieId, type } = req.query;
  const items = await shortVideoService.getAll({ movieId, type });

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getShortById = async (req, res) => {
  const item = await shortVideoService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

const getShortsByMovieId = async (req, res) => {
  const items = await shortVideoService.getByMovieId(req.params.movieId);
  sendSuccess(res, {
    movieId: Number(req.params.movieId),
    count: items.length,
    data: items,
  });
};

module.exports = {
  getShorts,
  getShortById,
  getShortsByMovieId,
};
