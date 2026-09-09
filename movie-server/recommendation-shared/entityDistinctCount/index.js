/**
 * Shared distinct-item → entity +1 counting (actors / artists).
 * Pure persistence factory — no movie/music affinity coupling.
 *
 * @module recommendation-shared/entityDistinctCount
 */

'use strict';

const mongoose = require('mongoose');

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
const toEntityIdList = (raw) => {
  if (raw === null || raw === undefined || raw === '') return [];
  const list = Array.isArray(raw) ? raw : [raw];
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const id = String(item ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
};

/**
 * @param {Object} opts
 * @param {string} opts.creditModelName
 * @param {string} opts.creditCollection
 * @param {string} opts.scoreModelName
 * @param {string} opts.scoreCollection
 * @param {string} opts.itemIdField — e.g. movieId | contentKey
 * @param {string} opts.entityIdField — e.g. actorId | artistId
 * @param {string} [opts.entityIdsField] — credit doc array field (default entityIds)
 */
const createEntityDistinctCountStore = (opts) => {
  const itemIdField = opts.itemIdField;
  const entityIdField = opts.entityIdField;
  const entityIdsField = opts.entityIdsField || 'entityIds';

  if (mongoose.models[opts.creditModelName]) {
    // hot-reload / double-require safe
  }

  const CreditModel =
    mongoose.models[opts.creditModelName] ||
    mongoose.model(
      opts.creditModelName,
      new mongoose.Schema(
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
          },
          [itemIdField]: {
            type: String,
            required: true,
            trim: true,
          },
          [entityIdsField]: {
            type: [String],
            default: [],
          },
          creditedAt: {
            type: Date,
            default: Date.now,
          },
        },
        {
          timestamps: { createdAt: true, updatedAt: false },
          collection: opts.creditCollection,
          versionKey: false,
        }
      )
        .index({ userId: 1, [itemIdField]: 1 }, { unique: true })
        .index({ creditedAt: -1 })
    );

  const ScoreModel =
    mongoose.models[opts.scoreModelName] ||
    mongoose.model(
      opts.scoreModelName,
      new mongoose.Schema(
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
          },
          [entityIdField]: {
            type: String,
            required: true,
            trim: true,
          },
          score: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
          },
          updatedAt: {
            type: Date,
            default: Date.now,
          },
        },
        {
          timestamps: { createdAt: true, updatedAt: false },
          collection: opts.scoreCollection,
          versionKey: false,
        }
      )
        .index({ userId: 1, [entityIdField]: 1 }, { unique: true })
        .index({ userId: 1, score: -1 })
    );

  const tryClaimItem = async (userId, itemId, entityIds) => {
    try {
      await CreditModel.create({
        userId,
        [itemIdField]: String(itemId),
        [entityIdsField]: Array.isArray(entityIds) ? entityIds : [],
        creditedAt: new Date(),
      });
      return true;
    } catch (err) {
      if (err?.code === 11000) return false;
      throw err;
    }
  };

  const releaseClaim = async (userId, itemId) => {
    await CreditModel.deleteOne({
      userId,
      [itemIdField]: String(itemId),
    }).catch(() => {});
  };

  const incrementEntityScores = async (userId, entityIds) => {
    const ids = toEntityIdList(entityIds);
    if (!ids.length) return 0;

    const now = new Date();
    const ops = ids.map((entityId) => ({
      updateOne: {
        filter: { userId, [entityIdField]: entityId },
        update: {
          $inc: { score: 1 },
          $set: { updatedAt: now },
          $setOnInsert: { userId, [entityIdField]: entityId },
        },
        upsert: true,
      },
    }));

    await ScoreModel.bulkWrite(ops, { ordered: false });
    return ids.length;
  };

  const listTopEntities = async (userId, listOpts = {}) => {
    const minScore = Math.max(1, Number(listOpts.minScore) || 2);
    const limit = Math.max(1, Number(listOpts.limit) || 40);

    const rows = await ScoreModel.find({
      userId,
      score: { $gte: minScore },
    })
      .sort({ score: -1, updatedAt: -1 })
      .limit(limit)
      .select({ _id: 0, [entityIdField]: 1, score: 1 })
      .lean();

    return (rows || []).map((row) => ({
      entityId: String(row[entityIdField]),
      score: Number(row.score) || 0,
    }));
  };

  return {
    CreditModel,
    ScoreModel,
    itemIdField,
    entityIdField,
    tryClaimItem,
    releaseClaim,
    incrementEntityScores,
    listTopEntities,
  };
};

/**
 * @param {Object} opts
 * @param {ReturnType<typeof createEntityDistinctCountStore>} opts.store
 * @param {string} opts.logPrefix
 * @param {number} [opts.minScore]
 * @param {number} [opts.defaultLimit]
 * @param {number} [opts.maxLimit]
 * @param {string} [opts.sourceLabel]
 * @param {string} [opts.resultKey] — response array key (actors | artists)
 * @param {string} [opts.idKey] — per-row id key (actorId | artistId)
 */
const createEntityDistinctCountService = (opts) => {
  const store = opts.store;
  const logPrefix = opts.logPrefix || '[entity-distinct-count]';
  const configuredMin = opts.minScore || 2;
  const defaultLimit = opts.defaultLimit || 40;
  const maxLimit = opts.maxLimit || 80;
  const sourceLabel = opts.sourceLabel || 'entity_watch_score';
  const resultKey = opts.resultKey || 'items';
  const idKey = opts.idKey || 'entityId';

  const applyCreditsFromItem = async (input = {}) => {
    try {
      const userId = input.userId;
      const itemId = String(input.itemId ?? '').trim();
      if (!userId || !itemId) {
        return { applied: false, entityCount: 0, reason: 'missing_ids' };
      }

      const entityIds = toEntityIdList(input.entityIds);
      if (!entityIds.length) {
        return { applied: false, entityCount: 0, reason: 'no_entities' };
      }

      const claimed = await store.tryClaimItem(userId, itemId, entityIds);
      if (!claimed) {
        return { applied: false, entityCount: 0, reason: 'already_credited' };
      }

      try {
        await store.incrementEntityScores(userId, entityIds);
      } catch (incErr) {
        await store.releaseClaim(userId, itemId);
        throw incErr;
      }

      return { applied: true, entityCount: entityIds.length };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`${logPrefix} applyCreditsFromItem failed:`, err?.message || err);
      return { applied: false, entityCount: 0, reason: 'error' };
    }
  };

  const listRecommended = async (userId, listOpts = {}) => {
    const requested = Number(listOpts.minScore);
    const minScore = Math.max(
      configuredMin,
      Number.isFinite(requested) && requested > 0 ? requested : configuredMin
    );
    let limit = Number(listOpts.limit);
    if (!Number.isFinite(limit) || limit <= 0) limit = defaultLimit;
    limit = Math.min(maxLimit, Math.floor(limit));

    const rows = await store.listTopEntities(userId, { minScore, limit });
    const items = rows.map((row) => ({
      [idKey]: row.entityId,
      score: row.score,
    }));

    return {
      [resultKey]: items,
      minScore,
      limit,
      source: items.length ? sourceLabel : 'empty',
    };
  };

  return {
    applyCreditsFromItem,
    listRecommended,
    toEntityIdList,
  };
};

module.exports = {
  toEntityIdList,
  createEntityDistinctCountStore,
  createEntityDistinctCountService,
};
