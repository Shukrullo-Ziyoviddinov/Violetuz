const Wishlist = require('../models/Wishlist.model');
const { WISHLIST_TYPES } = Wishlist;
const Movie = require('../models/Movie.model');
const Music = require('../models/Music.model');
const Album = require('../models/Album.model');
const Clip = require('../models/Clip.model');
const Concert = require('../models/Concert.model');
const ShortVideo = require('../models/ShortVideo.model');
const Triller = require('../models/Triller.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoMeta = (doc) => {
  if (!doc) return null;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, __v, ...rest } = plain;
  return rest;
};

const normalizeType = (raw) => {
  const type = String(raw || '')
    .trim()
    .toLowerCase();
  if (type === 'clip') return 'klip';
  if (type === 'concert') return 'konsert';
  if (type === 'short' || type === 'shortvideo') return 'shorts';
  return type;
};

const assertType = (raw) => {
  const type = normalizeType(raw);
  if (!WISHLIST_TYPES.includes(type)) {
    throw badRequest(`type noto‘g‘ri: ${raw}`, {
      allowedTypes: [...WISHLIST_TYPES],
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

/** Katalogdan entity topish + snapshot */
const resolveCatalogSnapshot = async (type, itemId) => {
  const idStr = normalizeItemId(itemId);
  const numericId = Number(idStr);
  const useNumeric = Number.isInteger(numericId) && String(numericId) === idStr;

  let doc = null;

  switch (type) {
    case 'movie':
      doc = useNumeric
        ? await Movie.findOne({ id: numericId }).lean()
        : null;
      break;
    case 'music':
      doc = useNumeric
        ? await Music.findOne({ id: numericId }).lean()
        : null;
      break;
    case 'album':
      doc = useNumeric
        ? await Album.findOne({ id: numericId }).lean()
        : null;
      break;
    case 'klip':
      doc = useNumeric
        ? await Clip.findOne({ id: numericId }).lean()
        : null;
      break;
    case 'konsert':
      doc = useNumeric
        ? await Concert.findOne({ id: numericId }).lean()
        : null;
      break;
    case 'shorts':
      doc = useNumeric
        ? await ShortVideo.findOne({ id: numericId }).lean()
        : null;
      break;
    case 'triller':
      doc = useNumeric
        ? await Triller.findOne({ id: numericId }).lean()
        : null;
      break;
    default:
      break;
  }

  if (!doc) {
    throw notFound(`${type} topilmadi: ${idStr}`);
  }

  return stripMongoMeta(doc);
};

const toClientItem = (row) => ({
  id: row.itemId,
  type: row.type,
  snapshot: row.snapshot || null,
  createdAt: row.createdAt,
});

/** Frontend normalizeId bilan mos: raqam bo‘lsa number */
const toFrontendId = (itemId) => {
  const num = parseInt(itemId, 10);
  return Number.isNaN(num) || String(num) !== String(itemId) ? itemId : num;
};

const toClientItemFrontend = (row) => ({
  id: toFrontendId(row.itemId),
  type: row.type,
  snapshot: row.snapshot || null,
  createdAt: row.createdAt,
});

const listWishlist = async (userId, { type } = {}) => {
  const query = { userId };
  if (type) {
    query.type = assertType(type);
  }
  const rows = await Wishlist.find(query).sort({ createdAt: -1 }).lean();
  return rows.map(toClientItemFrontend);
};

const addItem = async (userId, { id, type }) => {
  const safeType = assertType(type);
  const itemId = normalizeItemId(id);
  const snapshot = await resolveCatalogSnapshot(safeType, itemId);

  const row = await Wishlist.findOneAndUpdate(
    { userId, type: safeType, itemId },
    {
      $set: { snapshot },
      $setOnInsert: { userId, type: safeType, itemId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return toClientItemFrontend(row);
};

const removeItem = async (userId, { id, type }) => {
  const safeType = assertType(type);
  const itemId = normalizeItemId(id);
  const deleted = await Wishlist.findOneAndDelete({
    userId,
    type: safeType,
    itemId,
  }).lean();

  if (!deleted) {
    throw notFound('Wishlist yozuvi topilmadi');
  }

  return toClientItemFrontend(deleted);
};

/**
 * Toggle: bor bo‘lsa o‘chiradi, yo‘q bo‘lsa qo‘shadi.
 * @returns {{ added: boolean, item: object|null, items: array }}
 */
const toggleItem = async (userId, { id, type }) => {
  const safeType = assertType(type || 'movie');
  const itemId = normalizeItemId(id);

  const existing = await Wishlist.findOne({
    userId,
    type: safeType,
    itemId,
  }).lean();

  if (existing) {
    await Wishlist.deleteOne({ _id: existing._id });
    const items = await listWishlist(userId);
    return { added: false, item: toClientItemFrontend(existing), items };
  }

  const item = await addItem(userId, { id: itemId, type: safeType });
  const items = await listWishlist(userId);
  return { added: true, item, items };
};

/**
 * To‘liq almashtirish (migratsiya / sync).
 * Body: { items: [{ id, type }, ...] }
 */
const replaceWishlist = async (userId, itemsInput = []) => {
  if (!Array.isArray(itemsInput)) {
    throw badRequest('items massiv bo‘lishi kerak');
  }

  const normalized = [];
  const seen = new Set();
  for (const raw of itemsInput) {
    if (!raw || raw.id == null) continue;
    const safeType = assertType(raw.type || 'movie');
    const itemId = normalizeItemId(raw.id);
    const key = `${safeType}:${itemId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ type: safeType, itemId });
  }

  const docs = [];
  for (const entry of normalized) {
    try {
      const snapshot = await resolveCatalogSnapshot(entry.type, entry.itemId);
      docs.push({
        userId,
        type: entry.type,
        itemId: entry.itemId,
        snapshot,
      });
    } catch (err) {
      // Migratsiyada o‘chgan katalog elementini o‘tkazib yuborish
      if (err.status === 404) continue;
      throw err;
    }
  }

  await Wishlist.deleteMany({ userId });
  if (docs.length) {
    await Wishlist.insertMany(docs, { ordered: false });
  }

  return listWishlist(userId);
};

module.exports = {
  WISHLIST_TYPES,
  listWishlist,
  addItem,
  removeItem,
  toggleItem,
  replaceWishlist,
  assertType,
  normalizeItemId,
};
