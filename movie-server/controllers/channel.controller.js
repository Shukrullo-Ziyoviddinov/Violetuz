const channelService = require('../services/channel.service');
const { sendSuccess } = require('../utils/response');
const { buildChannelSharePage } = require('../utils/channelSharePage');

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

const getChannelShare = async (req, res) => {
  const channel = await channelService.getById(req.params.id);
  const baseUrl = process.env.PUBLIC_SITE_URL || 'https://www.violetplay.uz';
  res.status(200).type('html').send(buildChannelSharePage(channel, baseUrl));
};

module.exports = {
  getChannels,
  getChannelById,
  checkUsername,
  getChannelShare,
};
