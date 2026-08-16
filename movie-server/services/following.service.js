const Following = require('../models/Following.model');
const { FOLLOWING_TYPES } = Following;
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
  const type = String(raw || '')
    .trim()
    .toLowerCase();
  if (!FOLLOWING_TYPES.includes(type)) {
    throw badRequest(`type faqat actor yoki artist bo‘lishi kerak`, {
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
  if (type === 'artist') return String(targetId);
  const num = parseInt(targetId, 10);
  return Number.isNaN(num) || String(num) !== String(targetId) ? targetId : num;
};

const toClientItem = (row) => ({
  id: toFrontendId(row.targetId, row.type),
  type: row.type,
  snapshot: row.snapshot || null,
  createdAt: row.createdAt,
});

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
  return rows.map(toClientItem);
};

const addFollow = async (userId, { id, type }) => {
  const resolved = await resolveFollowSnapshot(id, type);
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
    throw notFound('Obuna topilmadi');
  }
  return toClientItem(deleted);
};

const toggleFollow = async (userId, { id, type }) => {
  const safeType = assertType(type || 'artist');
  const targetId = normalizeTargetId(id);
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
  addFollow,
  removeFollow,
  toggleFollow,
  replaceFollowing,
};
