const musicSectionService = require('../services/musicSection.service');
const musicPageContentService = require('../services/musicPageContent.service');
const { sendSuccess } = require('../utils/response');

const getMusicSections = async (_req, res) => {
  const sections = await musicSectionService.getAll();
  sendSuccess(res, {
    count: sections.length,
    data: sections,
  });
};

const getMusicSectionById = async (req, res) => {
  const item = await musicSectionService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

/** Music page layout blocks from DB (not music section definitions). */
const getMusicPageContent = async (_req, res) => {
  const content = await musicPageContentService.getBlocks();
  sendSuccess(res, {
    count: content.length,
    data: content,
  });
};

module.exports = {
  getMusicSections,
  getMusicSectionById,
  getMusicPageContent,
};
