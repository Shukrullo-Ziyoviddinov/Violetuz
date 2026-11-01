const ChannelModel = require('../models/Channel.model');
const { checkChannelUsernameAvailability } = require('./channelUsername');
const { badRequest, notFound } = require('../utils/errors');

const toPublicBanner = (item) => {
  if (!item || typeof item !== 'object') return null;
  const image = String(item.image || '').trim();
  if (!image) return null;
  return {
    id: item._id ? String(item._id) : String(item.id || ''),
    image,
  };
};

const toPublicProfileBanner = (profileBanner) => {
  const banners = Array.isArray(profileBanner?.banners)
    ? profileBanner.banners.map(toPublicBanner).filter(Boolean)
    : [];
  return { banners };
};

const stripMongoId = (doc) => {
  if (!doc) return doc;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, usernameNormalized, profileBanner, ...rest } = plain;
  return { ...rest, profileBanner: toPublicProfileBanner(profileBanner) };
};

class ChannelService {
  async getAll() {
    const items = await ChannelModel.find({}).sort({ sortOrder: 1, name: 1, id: 1 }).lean();
    return items.map(stripMongoId);
  }

  async getById(id) {
    const channelId = String(id || '').trim();
    if (!channelId) {
      throw badRequest(`Invalid channel id: ${id}`);
    }

    const item = await ChannelModel.findOne({ id: channelId }).lean();
    if (!item) {
      throw notFound(`Channel not found: ${id}`);
    }

    return stripMongoId(item);
  }

  /** Kanal @username bandmi: userlar va boshqa kanallar o‘qiladi. */
  async checkUsernameAvailability(rawUsername, excludeChannelId = null) {
    return checkChannelUsernameAvailability(rawUsername, excludeChannelId);
  }

  /** Obuna yozuvi uchun kanal nusxasi. User yoki aktor hujjatiga yozilmaydi. */
  async getFollowSnapshot(id) {
    const channel = await this.getById(id);
    return {
      id: channel.id,
      name: channel.name,
      username: channel.username,
      avatar: channel.avatar || '',
      profileBanner: channel.profileBanner || { banners: [] },
      subscribers: channel.subscribers ?? 0,
    };
  }
}

module.exports = new ChannelService();
