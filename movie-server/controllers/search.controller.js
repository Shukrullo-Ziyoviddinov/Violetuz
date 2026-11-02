const searchService = require('../services/search.service');
const { sendSuccess } = require('../utils/response');

const searchContent = async (req, res) => {
  const { q, lang = 'uz', section = null, cursor = 0, limit, channelId = null, channelType = null } = req.query;
  const result = await searchService.searchAll(q, lang, {
    section: section || null,
    cursor,
    limit: limit != null ? Number(limit) : undefined,
    channelId: channelId || null,
    channelType: channelType || null,
  });

  // Orqaga moslik: eski frontend faqat data kutadi; yangi — meta ham oladi
  sendSuccess(res, {
    data: result.data,
    meta: result.meta,
  });
};

module.exports = {
  searchContent,
};
