const asyncHandler = require('../middleware/asyncHandler');
const { sendSuccess } = require('../utils/response');
const movieRatingService = require('../services/movieRating.service');

const listHistory = asyncHandler(async (req, res) => {
  const history = await movieRatingService.listMyHistory(req.authUser._id);
  return sendSuccess(res, { data: { history } });
});

const getMyRating = asyncHandler(async (req, res) => {
  const item = await movieRatingService.getMyRatingForMovie(
    req.authUser._id,
    req.params.movieId
  );
  return sendSuccess(res, { data: { item } });
});

const submitRating = asyncHandler(async (req, res) => {
  const result = await movieRatingService.submitRating(req.authUser._id, {
    movieId: req.body?.movieId ?? req.body?.id,
    value: req.body?.value ?? req.body?.rating,
  });
  return sendSuccess(res, { data: result }, result.unchanged ? 200 : 201);
});

module.exports = {
  listHistory,
  getMyRating,
  submitRating,
};
