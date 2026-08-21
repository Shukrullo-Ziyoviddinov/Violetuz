const ShortDownloadEvent = require('../models/ShortDownloadEvent.model');
const { SHORT_DOWNLOAD_TYPES } = ShortDownloadEvent;
const ShortVideo = require('../models/ShortVideo.model');
const MusicShort = require('../models/MusicShort.model');
const { badRequest, notFound } = require('../utils/errors');

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
  if (!type || !SHORT_DOWNLOAD_TYPES.includes(type)) {
    throw badRequest(`type noto‘g‘ri: ${raw}`, {
      allowedTypes: [...SHORT_DOWNLOAD_TYPES],
    });
  }
  return type;
};

const normalizeItemId = (id) => {
  if (id == null || id === '') throw badRequest('id majburiy');
  return String(id).trim();
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

const getDownloadCount = async ({ id, type }) => {
  const safeType = assertType(type);
  const itemId = normalizeItemId(id);
  const downloadCount = await ShortDownloadEvent.countDocuments({
    type: safeType,
    itemId,
  });
  return { downloadCount, type: safeType, id: itemId };
};

/**
 * Client R2 dan to‘liq yuklab bo‘lgach chaqiriladi.
 * Server diskka yozmaydi — faqat hisob (+1).
 */
const recordDownload = async (userId, { id, type }) => {
  const safeType = assertType(type);
  const itemId = normalizeItemId(id);

  await assertShortExists(safeType, itemId);

  await ShortDownloadEvent.create({
    ...(userId ? { userId } : {}),
    type: safeType,
    itemId,
  });

  const downloadCount = await ShortDownloadEvent.countDocuments({
    type: safeType,
    itemId,
  });

  return {
    downloadCount,
    type: safeType,
    id: itemId,
  };
};

module.exports = {
  getDownloadCount,
  recordDownload,
  assertType,
  SHORT_DOWNLOAD_TYPES,
};
