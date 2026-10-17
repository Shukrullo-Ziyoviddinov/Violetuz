const trillerService = require('../services/triller.service');
const { serveTrillerList } = require('../recommendation-triller/services/serve.service');
const { sendSuccess } = require('../utils/response');

const sendList = (res, items) => {
  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getTrillers = async (req, res) => {
  const items = await serveTrillerList({
    userId: req.authUser?._id,
  });
  sendList(res, items);
};

const postGuestTrillers = async (req, res) => {
  if (req.authUser) {
    const items = await serveTrillerList({ userId: req.authUser._id });
    sendList(res, items);
    return;
  }

  const items = await serveTrillerList({
    localHistory: req.body?.localHistory,
    videoProgress: req.body?.videoProgress,
    userAge: req.body?.userAge,
  });
  sendList(res, items);
};

const getTrillerById = async (req, res) => {
  const item = await trillerService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

module.exports = {
  getTrillers,
  postGuestTrillers,
  getTrillerById,
};
