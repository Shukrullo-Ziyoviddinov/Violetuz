const bannerService = require('../services/banner.service');
const { sendSuccess } = require('../utils/response');

const getBanners = async (req, res) => {
  const { lang, movieId } = req.query;
  const items = await bannerService.getAll({ lang, movieId });

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getBannerById = async (req, res) => {
  const item = await bannerService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

const getBannersByLang = async (req, res) => {
  const items = await bannerService.getByLang(req.params.lang);
  sendSuccess(res, {
    lang: req.params.lang,
    count: items.length,
    data: items,
  });
};

module.exports = {
  getBanners,
  getBannerById,
  getBannersByLang,
};
