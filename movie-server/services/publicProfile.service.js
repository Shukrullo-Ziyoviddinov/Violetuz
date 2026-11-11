const mongoose = require('mongoose');
const User = require('../models/User.model');
const repostService = require('./repost.service');
const followingService = require('./following.service');
const { notFound } = require('../utils/errors');

const USER_ID_RE = /^[a-f0-9]{24}$/i;
const PUBLIC_USER_FIELDS = 'name username avatar bio';

const toPublicUser = (user) => ({
  id: String(user._id),
  name: user.name || '',
  username: user.username || '',
  avatar: user.avatar || '',
  bio: user.bio || '',
});

/**
 * Boshqa odam profilini o‘qish.
 * Email, parol va rol chiqmaydi. Yozish yo‘q.
 * Obunachilar — shu foydalanuvchiga user turi bilan yozilgan obunalar.
 */
const getPublicProfile = async (rawId) => {
  const id = String(rawId || '').trim();
  if (!USER_ID_RE.test(id) || !mongoose.Types.ObjectId.isValid(id)) {
    throw notFound('Foydalanuvchi topilmadi');
  }

  const user = await User.findById(id).select(PUBLIC_USER_FIELDS).lean();
  if (!user) {
    throw notFound('Foydalanuvchi topilmadi');
  }

  const userId = user._id;
  const [reposts, following, followers] = await Promise.all([
    repostService.listReposts(userId),
    followingService.listFollowing(userId),
    followingService.listUserFollowers(userId),
  ]);

  return {
    user: toPublicUser(user),
    reposts,
    following,
    followers,
    followersCount: followers.length,
  };
};

module.exports = {
  getPublicProfile,
};
