const movieSectionService = require('../services/movieSection.service');
const homeContentService = require('../services/homeContent.service');
const { sendSuccess } = require('../utils/response');

const getMovieSections = async (_req, res) => {
  const sections = await movieSectionService.getAll();
  sendSuccess(res, {
    count: sections.length,
    data: sections,
  });
};

const getMovieSectionById = async (req, res) => {
  const item = await movieSectionService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

/** Home page layout blocks from DB (not movie section definitions). */
const getHomeContent = async (_req, res) => {
  const content = await homeContentService.getBlocks();
  sendSuccess(res, {
    count: content.length,
    data: content,
  });
};

module.exports = {
  getMovieSections,
  getMovieSectionById,
  getHomeContent,
};
