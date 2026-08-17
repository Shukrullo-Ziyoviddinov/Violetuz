const Repost = require('../models/Repost.model');
const { REPOST_TYPES } = Repost;
const Movie = require('../models/Movie.model');
const Music = require('../models/Music.model');
const Clip = require('../models/Clip.model');
const Concert = require('../models/Concert.model');
const Artist = require('../models/Artist.model');
const ShortVideo = require('../models/ShortVideo.model');
const MusicShort = require('../models/MusicShort.model');
const { badRequest, notFound } = require('../utils/errors');

const SHORTS_TYPES = Object.freeze(['movieShorts', 'musicshorts']);

const TYPE_ALIASES = Object.freeze({
  movie: 'movie',
  music: 'music',
  klip: 'klip',
  clip: 'klip',
  konsert: 'konsert',
  concert: 'konsert',
  movieshorts: 'movieShorts',
  movieshort: 'movieShorts',
  musicshorts: 'musicshorts',
  musicshort: 'musicshorts',
});

const pickLocalized = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  return String(value.uz || value.ru || value.en || '').trim();
};

const slimSnapshot = ({ title, image, route, rating, artistName, videoUrl }) => {
  const snapshot = {
    title: title || '',
    image: image || '',
    route: route || '',
  };
  if (rating != null && rating !== '') snapshot.rating = Number(rating) || 0;
  if (artistName) snapshot.artistName = String(artistName);
  if (videoUrl) snapshot.videoUrl = String(videoUrl);
  return snapshot;
};

const normalizeType = (raw) => {
  const compact = String(raw || '')
    .trim()
    .replace(/_/g, '')
    .toLowerCase();
  return TYPE_ALIASES[compact] || null;
};

const assertType = (raw) => {
  const type = normalizeType(raw);
  if (!type || !REPOST_TYPES.includes(type)) {
    throw badRequest(`type noto‘g‘ri: ${raw}`, {
      allowedTypes: [...REPOST_TYPES],
    });
  }
  return type;
};

/** List filtri: canonical type yoki shorts (movieShorts + musicshorts) */
const listTypeFilter = (raw) => {
  if (raw == null || raw === '') return null;
  const compact = String(raw).trim().replace(/_/g, '').toLowerCase();
  if (compact === 'shorts' || compact === 'short') {
    return { $in: [...SHORTS_TYPES] };
  }
  return assertType(raw);
};

const normalizeItemId = (id) => {
  if (id == null || id === '') {
    throw badRequest('id majburiy');
  }
  return String(id).trim();
};

const toFrontendId = (itemId) => {
  const num = parseInt(itemId, 10);
  return Number.isNaN(num) || String(num) !== String(itemId) ? itemId : num;
};

const toClientItem = (row) => {
  const snap = row.snapshot || {};
  return {
    id: toFrontendId(row.itemId),
    type: row.type,
    title: snap.title || '',
    image: snap.image || '',
    route: snap.route || '',
    ...(snap.rating != null ? { rating: snap.rating } : {}),
    ...(snap.artistName ? { artistName: snap.artistName } : {}),
    ...(snap.videoUrl ? { videoUrl: snap.videoUrl } : {}),
    createdAt: row.createdAt,
  };
};

const toIdOnly = (row) => ({
  id: toFrontendId(row.itemId),
  type: row.type,
});

const artistNameById = async (artistId) => {
  if (!artistId) return '';
  const artist = await Artist.findOne({ id: String(artistId) })
    .select('name')
    .lean();
  return artist?.name || '';
};

const buildSlimSnapshot = async (type, itemId) => {
  const numericId = Number(itemId);
  const useNumeric = Number.isInteger(numericId) && String(numericId) === String(itemId);

  if (!useNumeric) {
    throw notFound(`${type} topilmadi: ${itemId}`);
  }

  switch (type) {
    case 'movie': {
      const doc = await Movie.findOne({ id: numericId })
        .select('id title homeImg rating')
        .lean();
      if (!doc) throw notFound(`movie topilmadi: ${itemId}`);
      return slimSnapshot({
        title: pickLocalized(doc.title),
        image: pickLocalized(doc.homeImg),
        route: `/movie/${doc.id}`,
        rating: doc.rating ?? 0,
      });
    }
    case 'music': {
      const doc = await Music.findOne({ id: numericId })
        .select('id title img artistId')
        .lean();
      if (!doc) throw notFound(`music topilmadi: ${itemId}`);
      return slimSnapshot({
        title: doc.title || '',
        image: doc.img || '',
        route: `/music/${doc.id}`,
        artistName: await artistNameById(doc.artistId),
      });
    }
    case 'klip':
    case 'konsert': {
      const Model = type === 'konsert' ? Concert : Clip;
      const doc = await Model.findOne({ id: numericId })
        .select('id title img artistId')
        .lean();
      if (!doc) throw notFound(`${type} topilmadi: ${itemId}`);
      return slimSnapshot({
        title: doc.title || '',
        image: doc.img || '',
        route: `/music/video/${doc.id}`,
        artistName: await artistNameById(doc.artistId),
      });
    }
    case 'movieShorts': {
      const doc = await ShortVideo.findOne({ id: numericId })
        .select('id movieId video description')
        .lean();
      if (!doc) throw notFound(`movieShorts topilmadi: ${itemId}`);
      let title = pickLocalized(doc.description);
      if (!title && doc.movieId != null) {
        const movie = await Movie.findOne({ id: doc.movieId }).select('title').lean();
        title = pickLocalized(movie?.title);
      }
      return slimSnapshot({
        title,
        image: '',
        route: '/shorts',
        videoUrl: pickLocalized(doc.video),
      });
    }
    case 'musicshorts': {
      const doc = await MusicShort.findOne({ id: numericId })
        .select('id video description')
        .lean();
      if (!doc) throw notFound(`musicshorts topilmadi: ${itemId}`);
      return slimSnapshot({
        title: pickLocalized(doc.description),
        image: '',
        route: '/music/shorts',
        videoUrl: pickLocalized(doc.video),
      });
    }
    default:
      throw badRequest(`type noto‘g‘ri: ${type}`);
  }
};

const listReposts = async (userId, { type } = {}) => {
  const query = { userId };
  const typeFilter = listTypeFilter(type);
  if (typeFilter) query.type = typeFilter;

  const rows = await Repost.find(query)
    .select('type itemId snapshot createdAt')
    .sort({ createdAt: -1 })
    .lean();

  return rows.map(toClientItem);
};

/** Profil/toggle holati uchun eng yengil payload — snapshot yo‘q */
const listRepostIds = async (userId, { type } = {}) => {
  const query = { userId };
  const typeFilter = listTypeFilter(type);
  if (typeFilter) query.type = typeFilter;

  const rows = await Repost.find(query)
    .select('type itemId')
    .sort({ createdAt: -1 })
    .lean();

  return rows.map(toIdOnly);
};

const addItem = async (userId, payload) => {
  const safeType = assertType(payload?.type);
  const itemId = normalizeItemId(payload?.id);
  const snapshot = await buildSlimSnapshot(safeType, itemId);

  try {
    const row = await Repost.findOneAndUpdate(
      { userId, type: safeType, itemId },
      {
        $set: { snapshot },
        $setOnInsert: { userId, type: safeType, itemId },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .select('type itemId snapshot createdAt')
      .lean();

    return toClientItem(row);
  } catch (err) {
    if (err?.code !== 11000) throw err;
    const row = await Repost.findOne({ userId, type: safeType, itemId })
      .select('type itemId snapshot createdAt')
      .lean();
    if (!row) throw err;
    return toClientItem(row);
  }
};

const removeItem = async (userId, { id, type }) => {
  const safeType = assertType(type);
  const itemId = normalizeItemId(id);
  const deleted = await Repost.findOneAndDelete({
    userId,
    type: safeType,
    itemId,
  })
    .select('type itemId snapshot createdAt')
    .lean();

  if (!deleted) {
    throw notFound('Repost topilmadi');
  }

  return toClientItem(deleted);
};

/**
 * Toggle: bor bo‘lsa o‘chiradi, yo‘q bo‘lsa qo‘shadi.
 * Butun ro‘yxatni qayta o‘qimaydi — faqat { added, item }.
 */
const toggleItem = async (userId, payload) => {
  const safeType = assertType(payload?.type);
  const itemId = normalizeItemId(payload?.id);

  const existing = await Repost.findOneAndDelete({
    userId,
    type: safeType,
    itemId,
  })
    .select('type itemId snapshot createdAt')
    .lean();

  if (existing) {
    return { added: false, item: toClientItem(existing) };
  }

  const item = await addItem(userId, { ...payload, id: itemId, type: safeType });
  return { added: true, item };
};

/**
 * To‘liq almashtirish (localStorage migratsiyasi).
 * Katalogda yo‘q yozuvlar o‘tkazib yuboriladi (404).
 * Body: { items: [{ id, type }, ...] }
 */
const replaceReposts = async (userId, itemsInput = []) => {
  if (!Array.isArray(itemsInput)) {
    throw badRequest('items massiv bo‘lishi kerak');
  }

  const normalized = [];
  const seen = new Set();
  for (const raw of itemsInput) {
    if (!raw || raw.id == null) continue;
    let safeType;
    try {
      safeType = assertType(raw.type);
    } catch {
      continue;
    }
    const itemId = normalizeItemId(raw.id);
    const key = `${safeType}:${itemId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ type: safeType, itemId });
  }

  const docs = (
    await Promise.all(
      normalized.map(async (entry) => {
        try {
          const snapshot = await buildSlimSnapshot(entry.type, entry.itemId);
          return {
            userId,
            type: entry.type,
            itemId: entry.itemId,
            snapshot,
          };
        } catch (err) {
          if (err.status === 404) return null;
          throw err;
        }
      })
    )
  ).filter(Boolean);

  await Repost.deleteMany({ userId });
  if (docs.length) {
    await Repost.insertMany(docs, { ordered: false });
  }

  return listReposts(userId);
};

module.exports = {
  REPOST_TYPES,
  listReposts,
  listRepostIds,
  addItem,
  removeItem,
  toggleItem,
  replaceReposts,
  assertType,
  normalizeItemId,
};
