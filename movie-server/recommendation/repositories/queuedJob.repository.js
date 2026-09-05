/**
 * Durable Mongo persistence for recommendation queue jobs.
 *
 * @module recommendation/repositories/queuedJob.repository
 */

'use strict';

const mongoose = require('mongoose');
const { QueuedJob } = require('../models');

const isMongoReady = () => mongoose.connection.readyState === 1;

/**
 * Insert or coalesce-update a durable job. Returns lean doc or null if Mongo down.
 *
 * @param {Object} input
 * @returns {Promise<Object|null>}
 */
const persistEnqueue = async (input) => {
  if (!isMongoReady()) return null;

  const name = String(input.name || '').trim();
  if (!name) return null;

  const coalesceKey =
    typeof input.coalesceKey === 'string' && input.coalesceKey
      ? input.coalesceKey
      : null;
  const maxAttempts = Math.max(1, Number(input.maxAttempts) || 3);
  const payload = input.payload != null ? input.payload : {};
  const now = new Date();

  if (coalesceKey) {
    const updated = await QueuedJob.findOneAndUpdate(
      {
        coalesceKey,
        status: { $in: ['pending', 'running'] },
      },
      {
        $set: {
          name,
          payload,
          maxAttempts,
          status: 'pending',
          attempt: 0,
          availableAt: now,
          lastError: null,
        },
        $setOnInsert: {
          coalesceKey,
          createdAt: now,
        },
      },
      { upsert: true, new: true, lean: true }
    );
    return updated;
  }

  const created = await QueuedJob.create({
    name,
    payload,
    coalesceKey: null,
    status: 'pending',
    attempt: 0,
    maxAttempts,
    availableAt: now,
  });
  return created.toObject();
};

/**
 * Mark running → done (delete to keep collection small).
 * @param {string|import('mongoose').Types.ObjectId} id
 */
const markJobDone = async (id) => {
  if (!isMongoReady() || !id) return;
  await QueuedJob.deleteOne({ _id: id });
};

/**
 * Fail or schedule retry.
 * @param {string|import('mongoose').Types.ObjectId} id
 * @param {Object} opts
 * @param {number} opts.attempt
 * @param {number} opts.maxAttempts
 * @param {string} [opts.errorMessage]
 * @param {number} [opts.retryDelayMs]
 */
const markJobRetryOrFail = async (id, opts = {}) => {
  if (!isMongoReady() || !id) return;

  const attempt = Math.max(0, Number(opts.attempt) || 0);
  const maxAttempts = Math.max(1, Number(opts.maxAttempts) || 3);
  const message = String(opts.errorMessage || '').slice(0, 2000);

  if (attempt < maxAttempts) {
    const delay = Math.max(0, Number(opts.retryDelayMs) || 500) * attempt;
    await QueuedJob.updateOne(
      { _id: id },
      {
        $set: {
          status: 'pending',
          attempt,
          availableAt: new Date(Date.now() + delay),
          lastError: message || null,
        },
      }
    );
    return;
  }

  await QueuedJob.updateOne(
    { _id: id },
    {
      $set: {
        status: 'failed',
        attempt,
        lastError: message || null,
      },
    }
  );
};

/**
 * After crash: running → pending; return claimable pending jobs.
 * @param {number} [limit=200]
 * @returns {Promise<Object[]>}
 */
const recoverDurableJobs = async (limit = 200) => {
  if (!isMongoReady()) return [];

  const stuckMs = 15 * 60 * 1000;
  const stuckBefore = new Date(Date.now() - stuckMs);

  await QueuedJob.updateMany(
    {
      status: 'running',
      updatedAt: { $lt: stuckBefore },
    },
    {
      $set: {
        status: 'pending',
        availableAt: new Date(),
        lastError: 'recovered_stuck_running',
      },
    }
  );

  const now = new Date();
  const rows = await QueuedJob.find({
    status: 'pending',
    availableAt: { $lte: now },
  })
    .sort({ createdAt: 1 })
    .limit(Math.max(1, limit))
    .lean();

  return rows;
};

/**
 * Claim job for worker (pending → running).
 * @param {string|import('mongoose').Types.ObjectId} id
 * @returns {Promise<Object|null>}
 */
const claimJob = async (id) => {
  if (!isMongoReady() || !id) return null;
  return QueuedJob.findOneAndUpdate(
    { _id: id, status: 'pending' },
    { $set: { status: 'running', updatedAt: new Date() } },
    { new: true, lean: true }
  );
};

module.exports = {
  isMongoReady,
  persistEnqueue,
  markJobDone,
  markJobRetryOrFail,
  recoverDurableJobs,
  claimJob,
};
