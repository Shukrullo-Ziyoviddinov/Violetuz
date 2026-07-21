const concertSectionService = require('../services/concertSection.service');
const { sendSuccess } = require('../utils/response');

const getConcertSections = async (_req, res) => {
  const items = await concertSectionService.getAll();

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getConcertSectionById = async (req, res) => {
  const item = await concertSectionService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

module.exports = {
  getConcertSections,
  getConcertSectionById,
};
