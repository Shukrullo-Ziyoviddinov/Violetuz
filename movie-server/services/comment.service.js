const Comment = require('../models/Comment.model');
const User = require('../models/User.model');
const Movie = require('../models/Movie.model');
const Triller = require('../models/Triller.model');
const Clip = require('../models/Clip.model');
const Concert = require('../models/Concert.model');
const ShortVideo = require('../models/ShortVideo.model');
const MusicShort = require('../models/MusicShort.model');
const { badRequest, notFound, createHttpError } = require('../utils/errors');
const {
  COMMENT_TYPES,
  MAX_COMMENT_LENGTH,
} = require('../constants/comment.constants');
const { sortCommentListByLikes } = require('../algo/commentLikeSortAlgo');

const assertType = (raw) => {
  const type = String(raw || '').trim();
  if (!COMMENT_TYPES.includes(type)) {
    throw badRequest(`targetType noto‘g‘ri: ${raw}`, {
      allowedTypes: [...COMMENT_TYPES],
    });
  }
  return type;
};

const normalizeTargetId = (id) => {
  if (id == null || id === '') throw badRequest('targetId majburiy');
  return String(id).trim();
};

const normalizeText = (raw) => {
  const text = String(raw ?? '').trim();
  if (!text) throw badRequest('Matn bo‘sh bo‘lmasligi kerak');
  if (text.length > MAX_COMMENT_LENGTH) {
    throw badRequest(`Matn ${MAX_COMMENT_LENGTH} belgidan oshmasin`);
  }
  return text;
};

const toObjectId = (id) => {
  if (!id) return null;
  const str = String(id);
  if (!require('mongoose').Types.ObjectId.isValid(str)) return null;
  return str;
};

const pickLocalized = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.uz || value.ru || value.en || '';
};

const toCatalogId = (raw) => {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

/**
 * History uchun yengil snapshot.
 * Topilmasa — create yiqilmasin (minimal snapshot).
 */
const buildTargetSnapshot = async (targetType, targetId) => {
  const numericId = toCatalogId(targetId);
  const fallback = {
    kind: targetType,
    id: targetId,
    title: null,
    image: null,
    route: null,
  };

  try {
    switch (targetType) {
      case 'movie': {
        if (numericId == null) return { ...fallback, kind: 'movie', movieId: targetId };
        const doc = await Movie.findOne({ id: numericId })
          .select('id title homeImg poster image rating category')
          .lean();
        if (!doc) return { ...fallback, kind: 'movie', movieId: targetId, route: `/movie/${targetId}` };
        return {
          kind: 'movie',
          movieId: doc.id,
          title: doc.title || null,
          homeImg: doc.homeImg || null,
          image: doc.poster || doc.image || null,
          route: `/movie/${doc.id}`,
          rating: doc.rating ?? 0,
          category: doc.category || null,
        };
      }
      case 'triller': {
        if (numericId == null) return { ...fallback, kind: 'triller', trillerId: targetId };
        const doc = await Triller.findOne({ id: numericId })
          .select('id title videoImg')
          .lean();
        if (!doc) {
          return {
            ...fallback,
            kind: 'triller',
            trillerId: targetId,
            route: `/triller/${targetId}`,
          };
        }
        return {
          kind: 'triller',
          trillerId: doc.id,
          title: doc.title || null,
          image: doc.videoImg || null,
          route: `/triller/${doc.id}`,
        };
      }
      case 'klip':
      case 'konsert': {
        const Model = targetType === 'konsert' ? Concert : Clip;
        if (numericId == null) {
          return {
            ...fallback,
            kind: 'video',
            videoType: targetType,
            videoId: targetId,
            route: `/music/video/${targetId}`,
          };
        }
        const doc = await Model.findOne({ id: numericId })
          .select('id title img artistId like dislike')
          .lean();
        if (!doc) {
          return {
            ...fallback,
            kind: 'video',
            videoType: targetType,
            videoId: targetId,
            route: `/music/video/${targetId}`,
          };
        }
        return {
          kind: 'video',
          videoType: targetType,
          videoId: doc.id,
          title: doc.title || '',
          image: doc.img || null,
          route: `/music/video/${doc.id}`,
          artistId: doc.artistId || null,
          like: doc.like ?? 0,
          dislike: doc.dislike ?? 0,
        };
      }
      case 'shorts': {
        if (numericId == null) {
          return {
            ...fallback,
            kind: 'shorts',
            shortsSource: 'movieShorts',
            shortsId: targetId,
          };
        }
        const doc = await ShortVideo.findOne({ id: numericId })
          .select('id type movieId video description')
          .lean();
        if (!doc) {
          return {
            ...fallback,
            kind: 'shorts',
            shortsSource: 'movieShorts',
            shortsId: targetId,
          };
        }
        let title = null;
        if (doc.movieId != null) {
          const movie = await Movie.findOne({ id: doc.movieId }).select('title').lean();
          title = movie?.title || null;
        }
        return {
          kind: 'shorts',
          shortsSource: 'movieShorts',
          shortsType: doc.type || 'movieShorts',
          shortsId: doc.id,
          movieId: doc.movieId ?? null,
          title,
          video: doc.video || null,
          description: doc.description || null,
        };
      }
      case 'musicShorts': {
        if (numericId == null) {
          return {
            ...fallback,
            kind: 'shorts',
            shortsSource: 'musicshorts',
            shortsId: targetId,
          };
        }
        const doc = await MusicShort.findOne({ id: numericId })
          .select('id type musicId contentType video description')
          .lean();
        if (!doc) {
          return {
            ...fallback,
            kind: 'shorts',
            shortsSource: 'musicshorts',
            shortsId: targetId,
          };
        }
        return {
          kind: 'shorts',
          shortsSource: 'musicshorts',
          shortsType: doc.type || 'musicshorts',
          shortsId: doc.id,
          musicId: doc.musicId ?? null,
          contentType: doc.contentType || 'music',
          title: doc.description || null,
          video: doc.video || null,
          description: doc.description || null,
        };
      }
      default:
        return fallback;
    }
  } catch {
    return fallback;
  }
};

const formatAuthorName = (user) => {
  if (!user) return 'Foydalanuvchi';
  const handle = (user.username || '').trim();
  const handlePart = handle ? `@${handle}` : '';
  return [user.name, handlePart].filter(Boolean).join(' ') || 'Foydalanuvchi';
};

const toClientComment = (row, viewerId = null) => {
  const id = String(row._id);
  const likedBy = Array.isArray(row.likedBy) ? row.likedBy.map(String) : [];
  const viewer = viewerId ? String(viewerId) : null;
  return {
    id,
    targetType: row.targetType,
    targetId: row.targetId,
    parentId: row.parentId ? String(row.parentId) : null,
    text: row.text,
    authorId: row.userId ? String(row.userId) : null,
    authorName: row.authorName || '',
    authorAvatar: row.authorAvatar || '',
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
    likes: Number(row.likes) || likedBy.length || 0,
    likedByMe: viewer ? likedBy.includes(viewer) : false,
    replies: [],
  };
};

/** Flat ro‘yxatdan daraxt */
const buildCommentTree = (rows, viewerId = null) => {
  const map = new Map();
  const roots = [];

  for (const row of rows) {
    map.set(String(row._id), toClientComment(row, viewerId));
  }

  for (const row of rows) {
    const node = map.get(String(row._id));
    const parentKey = row.parentId ? String(row.parentId) : null;
    if (parentKey && map.has(parentKey)) {
      map.get(parentKey).replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return sortCommentListByLikes(roots);
};

const listComments = async ({ targetType, targetId }, viewerId = null) => {
  const type = assertType(targetType);
  const id = normalizeTargetId(targetId);
  const rows = await Comment.find({ targetType: type, targetId: id })
    .sort({ createdAt: 1 })
    .lean();
  return buildCommentTree(rows, viewerId);
};

const createComment = async (userOrId, { targetType, targetId, text, parentId }) => {
  const type = assertType(targetType);
  const id = normalizeTargetId(targetId);
  const body = normalizeText(text);

  /* Controller authUser bersa — qo‘shimcha User.findById yo‘q */
  let user = null;
  if (userOrId && typeof userOrId === 'object' && userOrId._id) {
    user = userOrId;
  } else {
    user = await User.findById(userOrId).lean();
  }
  if (!user) throw createHttpError(401, 'Sessiya yaroqsiz');
  const userId = user._id;

  let parent = null;
  const parentOid = toObjectId(parentId);
  if (parentId) {
    if (!parentOid) throw badRequest('parentId noto‘g‘ri');
    parent = await Comment.findById(parentOid).select('targetType targetId targetSnapshot').lean();
    if (!parent) throw notFound('Javob beriladigan komment topilmadi');
    if (parent.targetType !== type || String(parent.targetId) !== id) {
      throw badRequest('parentId boshqa kontentga tegishli');
    }
  }

  const targetSnapshot = parent?.targetSnapshot
    ? parent.targetSnapshot
    : await buildTargetSnapshot(type, id);

  const row = await Comment.create({
    userId,
    targetType: type,
    targetId: id,
    parentId: parentOid,
    text: body,
    authorName: formatAuthorName(user),
    authorAvatar: user.avatar || '',
    likes: 0,
    likedBy: [],
    targetSnapshot,
  });

  return toClientComment(row.toObject ? row.toObject() : row, userId);
};

const updateComment = async (userId, commentId, { text }) => {
  const oid = toObjectId(commentId);
  if (!oid) throw badRequest('commentId noto‘g‘ri');
  const body = normalizeText(text);

  const row = await Comment.findById(oid);
  if (!row) throw notFound('Komment topilmadi');
  if (String(row.userId) !== String(userId)) {
    throw createHttpError(403, 'Faqat o‘z kommentingizni tahrirlashingiz mumkin');
  }

  row.text = body;
  await row.save();
  return toClientComment(row.toObject(), userId);
};

const deleteComment = async (userId, commentId) => {
  const oid = toObjectId(commentId);
  if (!oid) throw badRequest('commentId noto‘g‘ri');

  const row = await Comment.findById(oid).lean();
  if (!row) throw notFound('Komment topilmadi');
  if (String(row.userId) !== String(userId)) {
    throw createHttpError(403, 'Faqat o‘z kommentingizni o‘chirishingiz mumkin');
  }

  const idsToDelete = [row._id];
  const queue = [row._id];
  while (queue.length) {
    const current = queue.shift();
    const children = await Comment.find({ parentId: current }).select('_id').lean();
    for (const child of children) {
      idsToDelete.push(child._id);
      queue.push(child._id);
    }
  }

  await Comment.deleteMany({ _id: { $in: idsToDelete } });
  return {
    deletedId: String(row._id),
    deletedCount: idsToDelete.length,
    targetType: row.targetType,
    targetId: row.targetId,
  };
};

const toggleLike = async (userId, commentId) => {
  const oid = toObjectId(commentId);
  if (!oid) throw badRequest('commentId noto‘g‘ri');

  const row = await Comment.findById(oid);
  if (!row) throw notFound('Komment topilmadi');

  const uid = String(userId);
  const likedBy = (row.likedBy || []).map(String);
  const idx = likedBy.indexOf(uid);
  let liked;

  if (idx >= 0) {
    row.likedBy = row.likedBy.filter((id) => String(id) !== uid);
    liked = false;
  } else {
    row.likedBy.push(userId);
    liked = true;
  }
  row.likes = row.likedBy.length;
  await row.save();

  return {
    commentId: String(row._id),
    likes: row.likes,
    liked,
    item: toClientComment(row.toObject(), userId),
  };
};

/** Profil → komment history (faqat shu user yozganlari) */
const listMyHistory = async (userId) => {
  const rows = await Comment.find({ userId }).sort({ createdAt: -1 }).lean();
  return rows.map((row) => ({
    ...toClientComment(row, userId),
    targetSnapshot: row.targetSnapshot || null,
    filter:
      row.targetType === 'movie'
        ? 'movie'
        : row.targetType === 'konsert'
          ? 'konsert'
          : row.targetType === 'klip'
            ? 'klip'
            : row.targetType === 'triller'
              ? 'triller'
              : 'shorts',
  }));
};

/** Bitta target uchun viewer like qilgan komment id lari */
const listLikedIds = async (userId, { targetType, targetId }) => {
  const type = assertType(targetType);
  const id = normalizeTargetId(targetId);
  const rows = await Comment.find({
    targetType: type,
    targetId: id,
    likedBy: userId,
  })
    .select('_id')
    .lean();
  return rows.map((r) => String(r._id));
};

module.exports = {
  listComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike,
  listMyHistory,
  listLikedIds,
  COMMENT_TYPES,
  pickLocalized,
};
