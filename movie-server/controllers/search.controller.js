const searchService = require('../services/search.service');
const { sendSuccess } = require('../utils/response');

const searchContent = async (req, res) => {
  const { q, lang = 'uz' } = req.query;
  const data = await searchService.searchAll(q, lang);
  sendSuccess(res, { data });
};

module.exports = {
  searchContent,
};
