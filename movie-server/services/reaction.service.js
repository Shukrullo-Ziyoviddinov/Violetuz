const UserReaction = require('../models/UserReaction.model');
const {
  REACTION_TYPES,
  HISTORY_TYPES,
  REACTION_VALUES,
} = UserReaction;
const Movie = require('../models/Movie.model');
const Music = require('../models/Music.model');
const Clip = require('../models/Clip.model');
const Concert = require('../models/Concert.model');
const Triller = require('../models/Triller.model');
const ShortVideo = require('../models/ShortVideo.model');
const MusicShort = require('../models/MusicShort.model');
const { badRequest, notFound } = require('../utils/errors');

const stripMongoMeta = (doc) => {
  if (!doc) return null;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, __v, ...rest } = plain;
  return rest;
};

const normalizeType = (raw) => {
  const original = String(raw || '').trim();
  if (original === 'movieTriller') return 'movieTriller';

  const type = original.toLowerCase();
  if (type === 'clip') return 'klip';
  if (type === 'concert') return 'konsert';
  if (type === 'short' || type === 'shortvideo' || type === 'musicshort') return 'shorts';
  if (type === 'trailer') return 'triller';
  if (
    type === 'movietriller' ||
    type === 'movie-triller' ||
    type === 'movie_trailer' ||
    type === 'movietrailer'
  ) {
    return 'movieTriller';
  }
  return type;
};

const assertType = (raw) => {
  const type = normalizeType(raw);
  if (!REACTION_TYPES.includes(type)) {
    throw badRequest(`type noto‘g‘ri: ${raw}`, {
      allowedTypes: [...REACTION_TYPES],
    });
  }
  return type;
};

const normalizeTargetId = (id) => {
  if (id == null || id === '') throw badRequest('id majburiy');
  return String(id).trim();
};

const assertValue = (raw, type) => {
  const value = String(raw || '')
    .trim()
    .toLowerCase();
  if (value === 'none' || value === '') return 'none';
  if (!REACTION_VALUES.includes(value)) {
    throw badRequest(`value like|dislike|none bo‘lishi kerak`);
  }
  if (type === 'shorts' && value === 'dislike') {
    throw badRequest('shorts uchun faqat like mumkin');
  }
  return value;
};

const toFrontendId = (targetId, type) => {
  if (type === 'movieTriller') return String(targetId);
  const num = parseInt(targetId, 10);
  return Number.isNaN(num) || String(num) !== String(targetId) ? targetId : num;
};

const toClientItem = (row) => ({
  id: toFrontendId(row.targetId, row.type),
  type: row.type,
  value: row.value,
  snapshot: row.snapshot || null,
  updatedAt: row.updatedAt,
  createdAt: row.createdAt,
});

const historyPayloadFromSnapshot = (row) => {
  const snap = row.snapshot || {};
  const id = toFrontendId(row.targetId, row.type);
  let title = '';
  let image = '';
  let route = '';

  if (row.type === 'movie') {
    title =
      (typeof snap.title === 'object'
        ? snap.title?.uz || snap.title?.ru
        : snap.title) || '';
    image = snap.poster || snap.image || snap.img || '';
    route = `/movie/${id}`;
  } else if (row.type === 'music') {
    title = snap.title || '';
    image = snap.img || snap.image || '';
    route = `/music/${id}`;
  } else if (row.type === 'klip' || row.type === 'konsert') {
    title = snap.title || '';
    image = snap.img || snap.image || '';
    route = `/music/video/${id}`;
  }

  return {
    key: `${row.type === 'klip' ? 'clip' : row.type === 'konsert' ? 'concert' : row.type}:${route || id}`,
    contentId: String(id),
    category: row.type === 'klip' ? 'clip' : row.type === 'konsert' ? 'concert' : row.type,
    title,
    image,
    route,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).getTime() : Date.now(),
    snapshot: snap,
  };
};

const resolveSnapshot = async (type, targetId) => {
  const idStr = normalizeTargetId(targetId);
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
    case 'triller':
      doc = useNumeric ? await Triller.findOne({ id: numericId }).lean() : null;
      break;
    case 'movieTriller': {
      // targetId: `${movieId}-${trailerId}`
      const parts = idStr.split('-');
      const movieId = Number(parts[0]);
      const trailerId = Number(parts.slice(1).join('-'));
      if (!Number.isInteger(movieId) || movieId <= 0) {
        throw notFound(`movieTriller topilmadi: ${idStr}`);
      }
      const movie = await Movie.findOne({ id: movieId }).lean();
      if (!movie) throw notFound(`movieTriller movie topilmadi: ${movieId}`);
      const list = Array.isArray(movie.trailersVideo) ? movie.trailersVideo : [];
      const trailer =
        list.find((t) => Number(t?.id) === trailerId) ||
        list.find((t) => String(t?.id) === String(trailerId)) ||
        null;
      doc = {
        key: idStr,
        movieId,
        trailerId: Number.isFinite(trailerId) ? trailerId : parts.slice(1).join('-'),
        title: movie.title || null,
        poster: movie.poster || movie.image || null,
        trailer: trailer || null,
      };
      break;
    }
    case 'shorts':
      if (useNumeric) {
        doc = await ShortVideo.findOne({ id: numericId }).lean();
        if (!doc) doc = await MusicShort.findOne({ id: numericId }).lean();
      }
      break;
    default:
      break;
  }

  if (!doc) {
    throw notFound(`${type} topilmadi: ${idStr}`);
  }
  return stripMongoMeta(doc);
};

const listReactions = async (userId, { type } = {}) => {
  const query = { userId };
  if (type) query.type = assertType(type);
  const rows = await UserReaction.find(query).sort({ updatedAt: -1 }).lean();
  return rows.map(toClientItem);
};

/** Like-history: faqat movie/music/klip/konsert + value=like */
const listLikeHistory = async (userId) => {
  const rows = await UserReaction.find({
    userId,
    type: { $in: [...HISTORY_TYPES] },
    value: 'like',
  })
    .sort({ updatedAt: -1 })
    .lean();
  return rows.map(historyPayloadFromSnapshot);
};

/**
 * Reaction qo‘yish/yangilash/o‘chirish.
 * value=none → DB dan o‘chadi.
 */
const setReaction = async (userId, { id, type, value }) => {
  const safeType = assertType(type);
  const targetId = normalizeTargetId(id);
  const safeValue = assertValue(value, safeType);

  const musicLikeTypes = new Set(['klip', 'konsert']);
  const tracksAffinity =
    safeType === 'movie' || musicLikeTypes.has(safeType);

  if (safeValue === 'none') {
    const deleted = await UserReaction.findOneAndDelete({
      userId,
      type: safeType,
      targetId,
    }).lean();

    if (deleted?.value === 'like') {
      if (safeType === 'movie') {
        try {
          const { enqueueMovieUnlikeHook } = require('../recommendation/services/unlikeHook.service');
          enqueueMovieUnlikeHook(userId, targetId);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[reaction] unlike→recommendation hook failed:', err?.message || err);
        }
      } else if (musicLikeTypes.has(safeType)) {
        try {
          const {
            enqueueMusicUnlikeHook,
          } = require('../recommendation-music/services/unlikeHook.service');
          const contentType = safeType === 'klip' ? 'clip' : 'concert';
          enqueueMusicUnlikeHook(userId, contentType, targetId);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[reaction] unlike→music-recommendation hook failed:', err?.message || err);
        }
      }
    }

    return {
      item: deleted ? { ...toClientItem(deleted), value: 'none' } : null,
      removed: true,
    };
  }

  let previousValue = null;
  if (tracksAffinity) {
    const existing = await UserReaction.findOne({
      userId,
      type: safeType,
      targetId,
    })
      .select('value')
      .lean();
    previousValue = existing?.value || null;
  }

  const snapshot = await resolveSnapshot(safeType, targetId);
  const row = await UserReaction.findOneAndUpdate(
    { userId, type: safeType, targetId },
    {
      $set: { value: safeValue, snapshot },
      $setOnInsert: { userId, type: safeType, targetId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  // Movie like → affinity boost only (not "ko'rildi" / ContentView).
  if (safeType === 'movie' && safeValue === 'like' && previousValue !== 'like') {
    try {
      const { enqueueMovieLikeHook } = require('../recommendation/services/likeHook.service');
      enqueueMovieLikeHook(userId, targetId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[reaction] like→recommendation hook failed:', err?.message || err);
    }
  }

  // Clip/concert like → music affinity (music/album like yo‘q).
  if (musicLikeTypes.has(safeType) && safeValue === 'like' && previousValue !== 'like') {
    try {
      const { enqueueMusicLikeHook } = require('../recommendation-music/services/likeHook.service');
      const contentType = safeType === 'klip' ? 'clip' : 'concert';
      enqueueMusicLikeHook(userId, contentType, targetId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[reaction] like→music-recommendation hook failed:', err?.message || err);
    }
  }

  // Like → dislike: reverse likedBoost
  if (safeType === 'movie' && previousValue === 'like' && safeValue === 'dislike') {
    try {
      const { enqueueMovieUnlikeHook } = require('../recommendation/services/unlikeHook.service');
      enqueueMovieUnlikeHook(userId, targetId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[reaction] dislike→recommendation hook failed:', err?.message || err);
    }
  }

  if (musicLikeTypes.has(safeType) && previousValue === 'like' && safeValue === 'dislike') {
    try {
      const {
        enqueueMusicUnlikeHook,
      } = require('../recommendation-music/services/unlikeHook.service');
      const contentType = safeType === 'klip' ? 'clip' : 'concert';
      enqueueMusicUnlikeHook(userId, contentType, targetId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[reaction] dislike→music-recommendation hook failed:', err?.message || err);
    }
  }

  return { item: toClientItem(row), removed: false };
};

/** Shorts: like on/off */
const toggleShortsLike = async (userId, { id }) => {
  const targetId = normalizeTargetId(id);
  const existing = await UserReaction.findOne({
    userId,
    type: 'shorts',
    targetId,
  }).lean();

  if (existing) {
    await UserReaction.deleteOne({ _id: existing._id });
    return { liked: false, item: { ...toClientItem(existing), value: 'none' } };
  }

  const { item } = await setReaction(userId, {
    id: targetId,
    type: 'shorts',
    value: 'like',
  });
  return { liked: true, item };
};

/**
 * Bulk PUT /reactions sync — fire like/unlike hooks from movie reaction diff.
 * Same rules as setReaction: like ≠ ko'rildi; only likedBoost reverse/apply.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {Set<string>} prevLikedMovieIds
 * @param {Set<string>} nextLikedMovieIds
 */
const enqueueMovieReactionDiffHooks = (userId, prevLikedMovieIds, nextLikedMovieIds) => {
  for (const movieId of prevLikedMovieIds) {
    if (nextLikedMovieIds.has(movieId)) continue;
    try {
      const { enqueueMovieUnlikeHook } = require('../recommendation/services/unlikeHook.service');
      enqueueMovieUnlikeHook(userId, movieId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[reaction] replace unlike→recommendation hook failed:', err?.message || err);
    }
  }

  for (const movieId of nextLikedMovieIds) {
    if (prevLikedMovieIds.has(movieId)) continue;
    try {
      const { enqueueMovieLikeHook } = require('../recommendation/services/likeHook.service');
      enqueueMovieLikeHook(userId, movieId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[reaction] replace like→recommendation hook failed:', err?.message || err);
    }
  }
};

const replaceReactions = async (userId, itemsInput = []) => {
  if (!Array.isArray(itemsInput)) {
    throw badRequest('items massiv bo‘lishi kerak');
  }

  const prevMovieLikes = await UserReaction.find({
    userId,
    type: 'movie',
    value: 'like',
  })
    .select('targetId')
    .lean();
  const prevLikedMovieIds = new Set(prevMovieLikes.map((r) => String(r.targetId)));

  const docs = [];
  const seen = new Set();
  /** @type {Set<string>} */
  const nextLikedMovieIds = new Set();

  for (const raw of itemsInput) {
    if (!raw || raw.id == null || !raw.type) continue;
    let safeType;
    let safeValue;
    try {
      safeType = assertType(raw.type);
      safeValue = assertValue(raw.value || 'like', safeType);
    } catch {
      continue;
    }
    if (safeValue === 'none') continue;

    const targetId = normalizeTargetId(raw.id);
    const key = `${safeType}:${targetId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    try {
      const snapshot = await resolveSnapshot(safeType, targetId);
      docs.push({
        userId,
        type: safeType,
        targetId,
        value: safeValue,
        snapshot,
      });
      if (safeType === 'movie' && safeValue === 'like') {
        nextLikedMovieIds.add(String(targetId));
      }
    } catch (err) {
      if (err.status === 404) continue;
      throw err;
    }
  }

  await UserReaction.deleteMany({ userId });
  if (docs.length) {
    await UserReaction.insertMany(docs, { ordered: false });
  }

  enqueueMovieReactionDiffHooks(userId, prevLikedMovieIds, nextLikedMovieIds);

  const items = await listReactions(userId);
  const history = await listLikeHistory(userId);
  return { items, history };
};

module.exports = {
  REACTION_TYPES,
  HISTORY_TYPES,
  listReactions,
  listLikeHistory,
  setReaction,
  toggleShortsLike,
  replaceReactions,
};
