const mongoose = require('mongoose');
const Following = require('../models/Following.model');
const { FOLLOWING_TYPES } = Following;
const Actor = require('../models/Actor.model');
const Artist = require('../models/Artist.model');
const User = require('../models/User.model');
const channelService = require('./channel.service');
const { badRequest, notFound } = require('../utils/errors');

const USER_ID_RE = /^[a-f0-9]{24}$/i;

const stripMongoMeta = (doc) => {
  if (!doc) return null;
  const plain = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc };
  const { _id, __v, ...rest } = plain;
  return rest;
};

const assertType = (raw) => {
  const type = String(raw || '')
    .trim()
    .toLowerCase();
  if (!FOLLOWING_TYPES.includes(type)) {
    throw badRequest('type faqat actor, artist, channel yoki user bo‘lishi kerak', {
      allowedTypes: [...FOLLOWING_TYPES],
    });
  }
  return type;
};

const normalizeTargetId = (id) => {
  if (id == null || id === '') {
    throw badRequest('id majburiy');
  }
  return String(id).trim();
};

const toFrontendId = (targetId, type) => {
  if (type === 'artist' || type === 'channel' || type === 'user') return String(targetId);
  const num = parseInt(targetId, 10);
  return Number.isNaN(num) || String(num) !== String(targetId) ? targetId : num;
};

const toClientItem = (row) => ({
  id: toFrontendId(row.targetId, row.type),
  type: row.type,
  snapshot: row.snapshot || null,
  createdAt: row.createdAt,
});

const publicUserSnapshot = (user) => ({
  id: String(user._id),
  name: user.name || '',
  username: user.username || '',
  avatar: user.avatar || '',
});

const loadPublicUsers = async (ids) => {
  const unique = [...new Set(ids.map((id) => String(id)).filter((id) => USER_ID_RE.test(id)))];
  if (!unique.length) return new Map();
  const docs = await User.find({ _id: { $in: unique } })
    .select('name username avatar')
    .lean();
  return new Map(docs.map((doc) => [String(doc._id), doc]));
};

const withFreshUserSnapshots = async (items) => {
  const byId = await loadPublicUsers(
    items.filter((item) => item.type === 'user').map((item) => item.id)
  );
  return items.flatMap((item) => {
    if (item.type !== 'user') return [item];
    const user = byId.get(String(item.id));
    if (!user) return [];
    return [{ ...item, snapshot: publicUserSnapshot(user) }];
  });
};

const resolveUserFollow = async (idStr) => {
  if (!USER_ID_RE.test(idStr) || !mongoose.Types.ObjectId.isValid(idStr)) {
    throw notFound('Foydalanuvchi topilmadi');
  }
  const user = await User.findById(idStr).select('name username avatar').lean();
  if (!user) throw notFound('Foydalanuvchi topilmadi');
  return { type: 'user', targetId: String(user._id), snapshot: publicUserSnapshot(user) };
};

const assertNotSelfFollow = (userId, type, targetId) => {
  if (type === 'user' && String(userId) === String(targetId)) {
    throw badRequest('O‘zingizga obuna bo‘la olmaysiz');
  }
};

/**
 * type berilsa shu katalogdan; berilmasa artist → actor tartibida qidiradi
 * (localStorage migratsiyasi uchun).
 */
const resolveFollowSnapshot = async (targetId, typeHint = null) => {
  const idStr = normalizeTargetId(targetId);
  const numericId = Number(idStr);
  const useNumeric = Number.isInteger(numericId) && String(numericId) === idStr;

  if (typeHint) {
    const type = assertType(typeHint);
    if (type === 'user') {
      return resolveUserFollow(idStr);
    }
    if (type === 'channel') {
      const snapshot = await channelService.getFollowSnapshot(idStr);
      return { type, targetId: snapshot.id, snapshot };
    }
    if (type === 'artist') {
      const artist = await Artist.findOne({ id: idStr }).lean();
      if (!artist) throw notFound(`Artist topilmadi: ${idStr}`);
      return { type, targetId: idStr, snapshot: stripMongoMeta(artist) };
    }
    if (!useNumeric) throw notFound(`Actor topilmadi: ${idStr}`);
    const actor = await Actor.findOne({ id: numericId }).lean();
    if (!actor) throw notFound(`Actor topilmadi: ${idStr}`);
    return { type, targetId: idStr, snapshot: stripMongoMeta(actor) };
  }

  const artist = await Artist.findOne({ id: idStr }).lean();
  if (artist) {
    return { type: 'artist', targetId: idStr, snapshot: stripMongoMeta(artist) };
  }
  if (useNumeric) {
    const actor = await Actor.findOne({ id: numericId }).lean();
    if (actor) {
      return { type: 'actor', targetId: idStr, snapshot: stripMongoMeta(actor) };
    }
  }
  throw notFound(`Obuna target topilmadi: ${idStr}`);
};

const listFollowing = async (userId, { type } = {}) => {
  const query = { userId };
  if (type) query.type = assertType(type);
  const rows = await Following.find(query).sort({ createdAt: -1 }).lean();
  return withFreshUserSnapshots(rows.map(toClientItem));
};

/** Shu foydalanuvchiga user turi bilan obuna bo‘lganlar. */
const listUserFollowers = async (targetUserId) => {
  const targetId = String(targetUserId || '').trim();
  const rows = await Following.find({ type: 'user', targetId }).sort({ createdAt: -1 }).lean();
  const items = rows.map((row) => ({
    id: String(row.userId),
    type: 'user',
    snapshot: null,
    createdAt: row.createdAt,
  }));
  return withFreshUserSnapshots(items);
};

const addFollow = async (userId, { id, type }) => {
  const resolved = await resolveFollowSnapshot(id, type);
  assertNotSelfFollow(userId, resolved.type, resolved.targetId);
  const row = await Following.findOneAndUpdate(
    { userId, type: resolved.type, targetId: resolved.targetId },
    {
      $set: { snapshot: resolved.snapshot },
      $setOnInsert: {
        userId,
        type: resolved.type,
        targetId: resolved.targetId,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return toClientItem(row);
};

const removeFollow = async (userId, { id, type }) => {
  const safeType = assertType(type);
  const targetId = normalizeTargetId(id);
  const deleted = await Following.findOneAndDelete({
    userId,
    type: safeType,
    targetId,
  }).lean();
  if (!deleted) {
    return null;
  }
  return toClientItem(deleted);
};

const toggleFollow = async (userId, { id, type }) => {
  const safeType = assertType(type || 'artist');
  const targetId = normalizeTargetId(id);
  assertNotSelfFollow(userId, safeType, targetId);
  const existing = await Following.findOne({
    userId,
    type: safeType,
    targetId,
  }).lean();

  if (existing) {
    await Following.deleteOne({ _id: existing._id });
    const items = await listFollowing(userId);
    return { following: false, item: toClientItem(existing), items };
  }

  const item = await addFollow(userId, { id: targetId, type: safeType });
  const items = await listFollowing(userId);
  return { following: true, item, items };
};

/** To‘liq almashtirish / migratsiya: { items: [{ id, type? }] } */
const replaceFollowing = async (userId, itemsInput = []) => {
  if (!Array.isArray(itemsInput)) {
    throw badRequest('items massiv bo‘lishi kerak');
  }

  const docs = [];
  const seen = new Set();

  for (const raw of itemsInput) {
    if (raw == null) continue;
    const id = typeof raw === 'object' ? raw.id : raw;
    const typeHint = typeof raw === 'object' ? raw.type : null;
    if (id == null || id === '') continue;

    try {
      const resolved = await resolveFollowSnapshot(id, typeHint || null);
      const key = `${resolved.type}:${resolved.targetId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      docs.push({
        userId,
        type: resolved.type,
        targetId: resolved.targetId,
        snapshot: resolved.snapshot,
      });
    } catch (err) {
      if (err.status === 404) continue;
      throw err;
    }
  }

  await Following.deleteMany({ userId });
  if (docs.length) {
    await Following.insertMany(docs, { ordered: false });
  }
  return listFollowing(userId);
};

module.exports = {
  FOLLOWING_TYPES,
  listFollowing,
  listUserFollowers,
  addFollow,
  removeFollow,
  toggleFollow,
  replaceFollowing,
};
