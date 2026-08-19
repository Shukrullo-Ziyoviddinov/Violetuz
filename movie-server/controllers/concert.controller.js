const concertService = require('../services/concert.service');
const { sendSuccess } = require('../utils/response');
const { attachDocLikeCounts } = require('../utils/reactionCounts');

const getConcerts = async (req, res) => {
  const { categoryNameMusic, artistId, type, search } = req.query;
  const items = await concertService.getAll({ categoryNameMusic, artistId, type, search });

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getConcertById = async (req, res) => {
  const concert = await concertService.getById(req.params.id);
  const data = await attachDocLikeCounts('konsert', concert, req.authUser?._id);
  sendSuccess(res, { data });
};

const getConcertsByCategory = async (req, res) => {
  const items = await concertService.getByCategory(req.params.categoryNameMusic);
  sendSuccess(res, {
    categoryNameMusic: req.params.categoryNameMusic,
    count: items.length,
    data: items,
  });
};

const getConcertsByArtist = async (req, res) => {
  const items = await concertService.getByArtist(req.params.artistId);
  sendSuccess(res, {
    artistId: req.params.artistId,
    count: items.length,
    data: items,
  });
};

module.exports = {
  getConcerts,
  getConcertById,
  getConcertsByCategory,
  getConcertsByArtist,
};
