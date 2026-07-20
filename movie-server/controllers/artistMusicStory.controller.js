const artistMusicStoryService = require('../services/artistMusicStory.service');
const { sendSuccess } = require('../utils/response');

const getArtistMusicStories = async (req, res) => {
  const { artistId, search } = req.query;
  const items = await artistMusicStoryService.getAll({ artistId, search });

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getArtistMusicStoryById = async (req, res) => {
  const item = await artistMusicStoryService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

const getArtistMusicStoriesByArtist = async (req, res) => {
  const items = await artistMusicStoryService.getByArtist(req.params.artistId);
  sendSuccess(res, {
    artistId: req.params.artistId,
    count: items.length,
    data: items,
  });
};

module.exports = {
  getArtistMusicStories,
  getArtistMusicStoryById,
  getArtistMusicStoriesByArtist,
};
