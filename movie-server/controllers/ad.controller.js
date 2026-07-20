const adService = require('../services/ad.service');
const { sendSuccess } = require('../utils/response');

const getAds = async (req, res) => {
  const { isActive } = req.query;
  const items = await adService.getAll({ isActive });

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getAdById = async (req, res) => {
  const item = await adService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

const getActiveAds = async (_req, res) => {
  const items = await adService.getActive();
  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

module.exports = {
  getAds,
  getAdById,
  getActiveAds,
};
