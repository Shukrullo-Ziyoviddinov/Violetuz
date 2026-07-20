const movieService = require('../services/movie.service');
const { sendSuccess } = require('../utils/response');

const getMovies = async (req, res) => {
  const { categoryName, search } = req.query;
  const movies = await movieService.getAll({ categoryName, search });
  sendSuccess(res, {
    count: movies.length,
    data: movies,
  });
};

const getMovieById = async (req, res) => {
  const movie = await movieService.getById(req.params.id);
  sendSuccess(res, { data: movie });
};

const getMoviesByCategory = async (req, res) => {
  const movies = await movieService.getByCategory(req.params.categoryName);
  sendSuccess(res, {
    categoryName: req.params.categoryName,
    count: movies.length,
    data: movies,
  });
};

module.exports = {
  getMovies,
  getMovieById,
  getMoviesByCategory,
};
