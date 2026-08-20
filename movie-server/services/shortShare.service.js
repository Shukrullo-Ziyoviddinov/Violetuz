const ShortShareEvent = require('../models/ShortShareEvent.model');
const { SHORT_SHARE_TYPES, SHORT_SHARE_CHANNELS } = ShortShareEvent;
const ShortVideo = require('../models/ShortVideo.model');
const MusicShort = require('../models/MusicShort.model');
const { badRequest, notFound } = require('../utils/errors');
const { aggregateShareCounts } = require('../utils/shareCounts');

const normalizeType = (raw) => {
  const v = String(raw || '')
    .trim()
    .replace(/_/g, '')
    .toLowerCase();
  if (v === 'movieshorts' || v === 'movieshort') return 'movieShorts';
  if (v === 'musicshorts' || v === 'musicshort') return 'musicshorts';
  return null;
};

const assertType = (raw) => {
  const type = normalizeType(raw);
  if (!type || !SHORT_SHARE_TYPES.includes(type)) {
    throw badRequest(`type noto‘g‘ri: ${raw}`, {
      allowedTypes: [...SHORT_SHARE_TYPES],
    });
  }
  return type;
};

const normalizeItemId = (id) => {
  if (id == null || id === '') throw badRequest('id majburiy');
  return String(id).trim();
};

const normalizeChannel = (raw) => {
  const channel = String(raw || '')
    .trim()
    .toLowerCase();
  if (!SHORT_SHARE_CHANNELS.includes(channel)) {
    throw badRequest(`channel noto‘g‘ri: ${raw}`, {
      allowedChannels: [...SHORT_SHARE_CHANNELS],
    });
  }
  return channel;
};

const assertShortExists = async (type, itemId) => {
  const idStr = normalizeItemId(itemId);
  const numericId = Number(idStr);
  const useNumeric = Number.isInteger(numericId) && String(numericId) === idStr;

  if (type === 'movieShorts') {
    const doc = useNumeric
      ? await ShortVideo.findOne({ id: numericId }).select({ id: 1 }).lean()
      : null;
    if (!doc) throw notFound(`movieShorts topilmadi: ${idStr}`);
    return;
  }

  const doc = useNumeric
    ? await MusicShort.findOne({ id: numericId }).select({ id: 1 }).lean()
    : null;
  if (!doc) throw notFound(`musicshorts topilmadi: ${idStr}`);
};

const recordShare = async (userId, { id, type, channel }) => {
  const safeType = assertType(type);
  const itemId = normalizeItemId(id);
  const safeChannel = normalizeChannel(channel);

  await assertShortExists(safeType, itemId);

  await ShortShareEvent.create({
    userId,
    type: safeType,
    itemId,
    channel: safeChannel,
  });

  const counts = await aggregateShareCounts(safeType, [itemId]);
  return {
    shareCount: counts[itemId] || 0,
    type: safeType,
    id: itemId,
    channel: safeChannel,
  };
};

module.exports = {
  recordShare,
  assertType,
  normalizeChannel,
};
