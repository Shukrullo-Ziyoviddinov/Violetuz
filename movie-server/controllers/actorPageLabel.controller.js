const actorPageLabelService = require('../services/actorPageLabel.service');
const { sendSuccess } = require('../utils/response');

const getActorPageLabels = async (_req, res) => {
  const items = await actorPageLabelService.getAll();

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getActorPageLabelById = async (req, res) => {
  const item = await actorPageLabelService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

module.exports = {
  getActorPageLabels,
  getActorPageLabelById,
};
