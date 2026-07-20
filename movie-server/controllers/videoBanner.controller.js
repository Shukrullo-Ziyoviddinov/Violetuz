const videoBannerService = require('../services/videoBanner.service');
const { sendSuccess } = require('../utils/response');

const getVideoBanners = async (req, res) => {
  const { type, refId } = req.query;
  const items = await videoBannerService.getAll({ type, refId });

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getVideoBannerById = async (req, res) => {
  const item = await videoBannerService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

const getVideoBannersByType = async (req, res) => {
  const items = await videoBannerService.getByType(req.params.type);
  sendSuccess(res, {
    type: req.params.type,
    count: items.length,
    data: items,
  });
};

module.exports = {
  getVideoBanners,
  getVideoBannerById,
  getVideoBannersByType,
};
