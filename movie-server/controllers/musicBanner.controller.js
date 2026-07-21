const musicBannerService = require('../services/musicBanner.service');
const { sendSuccess } = require('../utils/response');

const getMusicBanners = async (_req, res) => {
  const items = await musicBannerService.getAll();
  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getMusicBannerById = async (req, res) => {
  const item = await musicBannerService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

module.exports = {
  getMusicBanners,
  getMusicBannerById,
};
