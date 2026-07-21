const clipSectionService = require('../services/clipSection.service');
const { sendSuccess } = require('../utils/response');

const getClipSections = async (_req, res) => {
  const sections = await clipSectionService.getAll();
  sendSuccess(res, {
    count: sections.length,
    data: sections,
  });
};

const getClipSectionById = async (req, res) => {
  const item = await clipSectionService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

module.exports = {
  getClipSections,
  getClipSectionById,
};
