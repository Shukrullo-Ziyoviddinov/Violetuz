const shortVideoService = require('../services/shortVideo.service');
const { sendSuccess } = require('../utils/response');
const { attachDocSaveCount, attachDocsSaveCount } = require('../utils/wishlistCounts');

const getShorts = async (req, res) => {
  const { movieId, type } = req.query;
  const items = await shortVideoService.getAll({ movieId, type });
  const data = await attachDocsSaveCount('movieShorts', items, req.authUser?._id);

  sendSuccess(res, {
    count: data.length,
    data,
  });
};

const getShortById = async (req, res) => {
  const item = await shortVideoService.getById(req.params.id);
  const data = await attachDocSaveCount('movieShorts', item, req.authUser?._id);
  sendSuccess(res, { data });
};

const getShortsByMovieId = async (req, res) => {
  const items = await shortVideoService.getByMovieId(req.params.movieId);
  const data = await attachDocsSaveCount('movieShorts', items, req.authUser?._id);
  sendSuccess(res, {
    movieId: Number(req.params.movieId),
    count: data.length,
    data,
  });
};

module.exports = {
  getShorts,
  getShortById,
  getShortsByMovieId,
};
