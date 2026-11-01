const User = require('../models/User.model');
const Channel = require('../models/Channel.model');
const { badRequest } = require('../utils/errors');

/** Userdagi qoida bilan bir xil: 3–30, harf, raqam, _ yoki . */
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,30}$/;

const normalizeUsername = (raw) => String(raw || '').trim().replace(/^@+/, '');

const assertUsernameFormat = (username) => {
  if (String(username || '').includes('-')) {
    throw badRequest('- belgi mumkun emas');
  }
  if (!USERNAME_RE.test(username)) {
    throw badRequest('Username 3–30 belgi: harf, raqam, _ yoki .');
  }
};

/** Kanal kolleksiyasida shu @username bormi. Tahrirda o‘z kanalini chiqarib tashlash mumkin. */
const channelHoldsUsername = async (usernameNormalized, excludeChannelId = null) => {
  const normalized = String(usernameNormalized || '').trim().toLowerCase();
  if (!normalized) return false;

  const query = { usernameNormalized: normalized };
  const excludeId = String(excludeChannelId || '').trim();
  if (excludeId) query.id = { $ne: excludeId };

  const row = await Channel.findOne(query).select('_id').lean();
  return Boolean(row);
};

/** User kolleksiyasidan faqat o‘qish: shu @username bandmi. User hujjatiga yozilmaydi. */
const userHoldsUsername = async (usernameNormalized) => {
  const normalized = String(usernameNormalized || '').trim().toLowerCase();
  if (!normalized) return false;

  const row = await User.findOne({ usernameNormalized: normalized }).select('_id').lean();
  return Boolean(row);
};

/**
 * Kanal yaratish/tahrir oldidan. User yoki boshqa kanal olib qo‘ygan bo‘lsa band.
 * excludeChannelId — keyin adminka tahririda o‘sha kanalning o‘z nomi band chiqmasin.
 */
const checkChannelUsernameAvailability = async (rawUsername, excludeChannelId = null) => {
  const username = normalizeUsername(rawUsername);
  if (!username) {
    throw badRequest('Username majburiy');
  }
  assertUsernameFormat(username);

  const usernameNormalized = username.toLowerCase();
  const takenByUser = await userHoldsUsername(usernameNormalized);
  const takenByChannel = takenByUser
    ? false
    : await channelHoldsUsername(usernameNormalized, excludeChannelId);
  const taken = takenByUser || takenByChannel;

  return {
    username,
    available: !taken,
    message: taken ? 'Bu username band' : "Username bo'sh",
  };
};

module.exports = {
  USERNAME_RE,
  normalizeUsername,
  assertUsernameFormat,
  channelHoldsUsername,
  userHoldsUsername,
  checkChannelUsernameAvailability,
};
