const actorService = require('../services/actor.service');
const { sendSuccess } = require('../utils/response');

const getActors = async (req, res) => {
  const { actorsGenre, search, ids } = req.query;

  const filters = { actorsGenre, search };

  if (ids != null) {
    filters.ids = String(ids)
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);
  }

  const items = await actorService.getAll(filters);

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getActorById = async (req, res) => {
  const actor = await actorService.getById(req.params.id);
  sendSuccess(res, { data: actor });
};

const getActorsByGenre = async (req, res) => {
  const items = await actorService.getByGenre(req.params.actorsGenre);
  sendSuccess(res, {
    actorsGenre: req.params.actorsGenre,
    count: items.length,
    data: items,
  });
};

module.exports = {
  getActors,
  getActorById,
  getActorsByGenre,
};
