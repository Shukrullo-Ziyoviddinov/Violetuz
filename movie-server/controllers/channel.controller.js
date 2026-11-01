const channelService = require('../services/channel.service');
const { sendSuccess } = require('../utils/response');

const getChannels = async (_req, res) => {
  const items = await channelService.getAll();

  sendSuccess(res, {
    count: items.length,
    data: items,
  });
};

const getChannelById = async (req, res) => {
  const item = await channelService.getById(req.params.id);
  sendSuccess(res, { data: item });
};

const checkUsername = async (req, res) => {
  const result = await channelService.checkUsernameAvailability(req.query.username);
  sendSuccess(res, { data: result });
};

module.exports = {
  getChannels,
  getChannelById,
  checkUsername,
};
