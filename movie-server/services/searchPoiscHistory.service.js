const SearchPoiscHistory = require('../models/SearchPoiscHistory.model');
const {
  SEARCH_POISC_HISTORY_TYPES,
  MAX_HISTORY_PER_USER,
  normalizeType,
} = require('../utils/searchPoiscHistoryTypes');
const Movie = require('../models/Movie.model');
const Music = require('../models/Music.model');
const Clip = require('../models/Clip.model');
const Concert = require('../models/Concert.model');
const Actor = require('../models/Actor.model');
const Artist = require('../models/Artist.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoMeta = (doc) => {
  if (!doc) return null;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, __v, ...rest } = plain;
  return rest;
};

const assertType = (raw) => {
  const type = normalizeType(raw);
  if (!SEARCH_POISC_HISTORY_TYPES.includes(type)) {
    throw badRequest(`type noto‘g‘ri: ${raw}`, {
      allowedTypes: [...SEARCH_POISC_HISTORY_TYPES],
    });
  }
  return type;
};

const normalizeItemId = (id) => {
  if (id == null || id === '') {
    throw badRequest('id majburiy');
  }
  return String(id).trim();
};

/** Frontend bilan: raqam bo‘lsa number */
const toFrontendId = (itemId) => {
  const num = parseInt(itemId, 10);
  return Number.isNaN(num) || String(num) !== String(itemId) ? itemId : num;
};

const toClientItem = (row) => ({
  id: toFrontendId(row.itemId),
  type: row.type,
  snapshot: row.snapshot || null,
  clickedAt: row.clickedAt,
  createdAt: row.createdAt,
});

/**
 * Katalogdan snapshot — movie/music/klip/konsert/actor/artist.
 * Query matni hech qachon saqlanmaydi.
 */
const resolveCatalogSnapshot = async (type, itemId) => {
  const idStr = normalizeItemId(itemId);
  const numericId = Number(idStr);
  const useNumeric = Number.isInteger(numericId) && String(numericId) === idStr;

  let doc = null;

  switch (type) {
    case 'movie':
      doc = useNumeric ? await Movie.findOne({ id: numericId }).lean() : null;
      break;
    case 'music':
      doc = useNumeric ? await Music.findOne({ id: numericId }).lean() : null;
      break;
    case 'klip':
      doc = useNumeric ? await Clip.findOne({ id: numericId }).lean() : null;
      break;
    case 'konsert':
      doc = useNumeric ? await Concert.findOne({ id: numericId }).lean() : null;
      break;
    case 'actor':
      doc = useNumeric ? await Actor.findOne({ id: numericId }).lean() : null;
      break;
    case 'artist':
      doc = await Artist.findOne({ id: idStr }).lean();
      break;
    default:
      break;
  }

  if (!doc) {
    throw notFound(`${type} topilmadi: ${idStr}`);
  }

  return stripMongoMeta(doc);
};

/** Limitdan ortiq eski yozuvlarni o‘chirish */
const trimHistory = async (userId) => {
  const overflow = await SearchPoiscHistory.find({ userId })
    .sort({ clickedAt: -1 })
    .skip(MAX_HISTORY_PER_USER)
    .select('_id')
    .lean();

  if (!overflow.length) return;

  await SearchPoiscHistory.deleteMany({
    _id: { $in: overflow.map((row) => row._id) },
  });
};

/**
 * Click yozish: bor bo‘lsa snapshot + clickedAt yangilanadi (yuqoriga chiqadi).
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {{ id: string|number, type: string }} payload
 */
const recordClick = async (userId, { id, type }) => {
  if (!userId) {
    throw badRequest('userId majburiy');
  }

  const safeType = assertType(type);
  const itemId = normalizeItemId(id);
  const snapshot = await resolveCatalogSnapshot(safeType, itemId);
  const now = new Date();

  const row = await SearchPoiscHistory.findOneAndUpdate(
    { userId, type: safeType, itemId },
    {
      $set: { snapshot, clickedAt: now },
      $setOnInsert: { userId, type: safeType, itemId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  await trimHistory(userId);
  return toClientItem(row);
};

/**
 * Foydalanuvchi tarixi — eng so‘nggi clicklar yuqorida.
 */
const listHistory = async (userId, { limit } = {}) => {
  if (!userId) {
    throw badRequest('userId majburiy');
  }

  const size = Math.min(
    MAX_HISTORY_PER_USER,
    Math.max(1, Number(limit) || MAX_HISTORY_PER_USER)
  );

  const rows = await SearchPoiscHistory.find({ userId })
    .sort({ clickedAt: -1 })
    .limit(size)
    .lean();

  return rows.map(toClientItem);
};

const removeItem = async (userId, { id, type }) => {
  if (!userId) {
    throw badRequest('userId majburiy');
  }

  const safeType = assertType(type);
  const itemId = normalizeItemId(id);
  const deleted = await SearchPoiscHistory.findOneAndDelete({
    userId,
    type: safeType,
    itemId,
  }).lean();

  if (!deleted) {
    throw notFound('Qidiruv tarixi yozuvi topilmadi');
  }

  return toClientItem(deleted);
};

/** Barcha tarixni tozalash */
const clearHistory = async (userId) => {
  if (!userId) {
    throw badRequest('userId majburiy');
  }

  const result = await SearchPoiscHistory.deleteMany({ userId });
  return { deletedCount: result.deletedCount || 0 };
};

module.exports = {
  SEARCH_POISC_HISTORY_TYPES,
  MAX_HISTORY_PER_USER,
  listHistory,
  recordClick,
  removeItem,
  clearHistory,
  assertType,
  normalizeItemId,
  normalizeType,
};
