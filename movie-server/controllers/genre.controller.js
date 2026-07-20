const genreService = require('../services/genre.service');
const { sendSuccess } = require('../utils/response');

const getGenres = async (req, res) => {
  const { search } = req.query;
  const items = await genreService.getAll({ search });

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getGenreById = async (req, res) => {
  const item = await genreService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

module.exports = {
  getGenres,
  getGenreById,
};
