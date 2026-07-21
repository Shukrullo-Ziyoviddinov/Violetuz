const fs = require('fs');
const { MUSIC_PAGE_CONTENT_JSON } = require('../config/paths');
const musicSectionService = require('../services/musicSection.service');
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

/** Music page layout blocks from file (not music section definitions). */
const getMusicPageContent = (_req, res) => {
  const raw = fs.readFileSync(MUSIC_PAGE_CONTENT_JSON, 'utf8');
  const content = JSON.parse(raw);
  sendSuccess(res, {
    count: Array.isArray(content) ? content.length : 0,
    data: content,
  });
};

module.exports = {
  getMusicSections,
  getMusicSectionById,
  getMusicPageContent,
};
