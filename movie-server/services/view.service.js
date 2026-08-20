const ContentView = require('../models/ContentView.model');
const { VIEW_TYPES } = ContentView;
const Movie = require('../models/Movie.model');
const Music = require('../models/Music.model');
const Clip = require('../models/Clip.model');
const Concert = require('../models/Concert.model');
const Triller = require('../models/Triller.model');
const { badRequest, notFound } = require('../utils/errors');

const TYPE_ALIASES = Object.freeze({
  movie: 'movie',
  music: 'music',
  klip: 'klip',
  clip: 'klip',
  konsert: 'konsert',
  concert: 'konsert',
  triller: 'triller',
  trailer: 'triller',
});

const normalizeType = (raw) => {
  const compact = String(raw || '')
    .trim()
    .replace(/_/g, '')
    .toLowerCase();
  return TYPE_ALIASES[compact] || null;
};

const assertType = (raw) => {
  const type = normalizeType(raw);
  if (!type || !VIEW_TYPES.includes(type)) {
    throw badRequest(`type noto‘g‘ri: ${raw}`, {
      allowedTypes: [...VIEW_TYPES],
    });
  }
  return type;
};

const normalizeItemId = (id) => {
  if (id == null || id === '') throw badRequest('id majburiy');
  return String(id).trim();
};

const assertItemExists = async (type, itemId) => {
  const idStr = normalizeItemId(itemId);
  const numericId = Number(idStr);
  const useNumeric = Number.isInteger(numericId) && String(numericId) === idStr;

  let doc = null;
  switch (type) {
    case 'movie':
      doc = useNumeric
        ? await Movie.findOne({ id: numericId }).select({ id: 1 }).lean()
        : null;
      break;
    case 'music':
      doc = useNumeric
        ? await Music.findOne({ id: numericId }).select({ id: 1 }).lean()
        : null;
      break;
    case 'klip':
      doc = useNumeric
        ? await Clip.findOne({ id: numericId }).select({ id: 1 }).lean()
        : null;
      break;
    case 'konsert':
      doc = useNumeric
        ? await Concert.findOne({ id: numericId }).select({ id: 1 }).lean()
        : null;
      break;
    case 'triller':
      doc = useNumeric
        ? await Triller.findOne({ id: numericId }).select({ id: 1 }).lean()
        : null;
      break;
    default:
      break;
  }

  if (!doc) throw notFound(`${type} topilmadi: ${idStr}`);
};

const getViewCount = async ({ id, type }) => {
  const safeType = assertType(type);
  const itemId = normalizeItemId(id);
  const viewCount = await ContentView.countDocuments({ type: safeType, itemId });
  return { viewCount, type: safeType, id: itemId };
};

/**
 * Bitta user + type + id uchun bir marta yoziladi.
 * Qayta kirishda unique index tufayli +1 bo‘lmaydi.
 */
const recordView = async (userId, { id, type }) => {
  const safeType = assertType(type);
  const itemId = normalizeItemId(id);

  await assertItemExists(safeType, itemId);

  let recorded = false;
  try {
    await ContentView.create({
      userId,
      type: safeType,
      itemId,
    });
    recorded = true;
  } catch (err) {
    if (err?.code !== 11000) throw err;
  }

  const viewCount = await ContentView.countDocuments({ type: safeType, itemId });
  return {
    viewCount,
    recorded,
    type: safeType,
    id: itemId,
  };
};

module.exports = {
  recordView,
  getViewCount,
  assertType,
  VIEW_TYPES,
};
