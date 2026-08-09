const trillerService = require('../services/triller.service');
const { sendSuccess } = require('../utils/response');

const getTrillers = async (_req, res) => {
  const items = await trillerService.getAll();

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getTrillerById = async (req, res) => {
  const item = await trillerService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

module.exports = {
  getTrillers,
  getTrillerById,
};
