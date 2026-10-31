'use strict';

const collections = require('../config/collections');
const { parseProfileRef } = require('../services/profileHeat/profileRef');

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 400;

/**
 * @param {object|null} doc
 */
const stripId = (doc) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
};

/**
 * @param {unknown} value
 * @returns {Date|null}
 */
const asDate = (value) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return null;
  return new Date(value.getTime());
};

/**
 * @param {unknown} value
 * @returns {number|null}
 */
const count = (value) => {
  if (!Number.isSafeInteger(value) || value < 0) return null;
  return value;
};

/**
 * @param {unknown} doc
 * @returns {{ kind: string, id: string|number, key: string }|null}
 */
const identityOf = (doc) => {
  if (!doc || typeof doc !== 'object') return null;
  const ref = parseProfileRef(doc.key);
  if (!ref || doc.kind !== ref.kind) return null;
  if (typeof doc.id !== typeof ref.id || doc.id !== ref.id) return null;
  return ref;
};

/**
 * @param {unknown} days
 * @param {string[]} fields
 * @returns {object[]|null}
 */
const dayRows = (days, fields) => {
  if (!Array.isArray(days) || days.length > MAX_DAYS) return null;
  const seen = new Set();
  const out = [];

  for (let i = 0; i < days.length; i += 1) {
    const row = days[i];
    if (!row || typeof row.day !== 'string' || !DAY.test(row.day) || seen.has(row.day)) return null;
    seen.add(row.day);
    const stored = { day: row.day };
    for (let j = 0; j < fields.length; j += 1) {
      const field = fields[j];
      const value = count(row[field]);
      if (value == null) return null;
      stored[field] = value;
    }
    out.push(stored);
  }

  out.sort((left, right) => (left.day < right.day ? -1 : left.day > right.day ? 1 : 0));
  return out;
};

/**
 * @param {unknown} userId
 * @returns {string|null}
 */
const userIdOf = (userId) => {
  if (typeof userId !== 'string') return null;
  const text = userId.trim();
  return text || null;
};

/**
 * Global profile activity and one user's extra-share slowdown.
 * Neither write touches reco_user_profiles.
 * @param {import('mongoose').Connection|import('mongodb').Db} connection
 */
const createProfileHeatRepo = (connection) => {
  if (!connection || typeof connection.collection !== 'function') {
    throw new Error('shorts-reco requires the existing database connection');
  }

  const heat = () => connection.collection(collections.reco.profileHeat);
  const users = () => connection.collection(collections.reco.profileHeatUsers);

  return {
    /**
     * @param {unknown} key
     */
    async findHeat(key) {
      const ref = parseProfileRef(key);
      if (!ref) return null;
      return stripId(await heat().findOne({ key: ref.key }));
    },

    /**
     * Every stored profile. Scoring the short list is done by the caller.
     * @returns {Promise<object[]>}
     */
    async listHeat() {
      const docs = await heat().find({}).toArray();
      return docs.map(stripId);
    },

    /**
     * @param {object} doc
     */
    async saveHeat(doc) {
      const ref = identityOf(doc);
      const days = dayRows(doc && doc.days, ['likes', 'comments', 'rewatches']);
      const updatedAt = asDate(doc && doc.updatedAt);
      if (!ref || !days || !updatedAt) throw new Error('invalid profile heat');
      const stored = {
        key: ref.key,
        kind: ref.kind,
        id: ref.id,
        days,
        updatedAt,
      };
      await heat().replaceOne({ key: ref.key }, stored, { upsert: true });
      return stored;
    },

    /**
     * @param {unknown} userId
     * @param {unknown} key
     */
    async findUserSlowdown(userId, key) {
      const id = userIdOf(userId);
      const ref = parseProfileRef(key);
      if (!id || !ref) return null;
      return stripId(await users().findOne({ userId: id, key: ref.key }));
    },

    /**
     * @param {object} doc
     */
    async saveUserSlowdown(doc) {
      const id = userIdOf(doc && doc.userId);
      const ref = identityOf(doc);
      const days = dayRows(doc && doc.days, ['passes']);
      const updatedAt = asDate(doc && doc.updatedAt);
      if (!id || !ref || !days || !updatedAt) throw new Error('invalid profile slowdown');
      const stored = {
        userId: id,
        key: ref.key,
        kind: ref.kind,
        id: ref.id,
        days,
        updatedAt,
      };
      await users().replaceOne({ userId: id, key: ref.key }, stored, { upsert: true });
      return stored;
    },
  };
};

module.exports = {
  createProfileHeatRepo,
};
