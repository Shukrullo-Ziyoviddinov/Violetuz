const movieService = require('../services/movie.service');
const { sendSuccess } = require('../utils/response');
const { attachDocLikeCounts } = require('../utils/reactionCounts');

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
  const data = await attachDocLikeCounts('movie', movie, req.authUser?._id);
  sendSuccess(res, { data });
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
