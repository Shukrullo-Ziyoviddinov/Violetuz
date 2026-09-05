const mongoose = require('mongoose');

/**
 * Durable job rows for recommendation queue (survives process restart).
 * Collection: recommendation_queued_jobs
 *
 * In-process workers still run handlers; this table is the source of truth
 * for pending/retry after crash (Bull/Redis o‘rniga MVP).
 *
 * @module recommendation/models/QueuedJob
 */

const queuedJobSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    /** Same key → replace pending payload (affinity/precompute coalesce) */
    coalesceKey: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'done', 'failed'],
      default: 'pending',
      index: true,
    },
    attempt: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: 1,
    },
    /** Do not claim before this time (retry backoff) */
    availableAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'recommendation_queued_jobs',
    versionKey: false,
  }
);

queuedJobSchema.index({ status: 1, availableAt: 1, createdAt: 1 });
/** Coalesce: one open job per key */
queuedJobSchema.index(
  { coalesceKey: 1, status: 1 },
  {
    partialFilterExpression: {
      coalesceKey: { $type: 'string' },
      status: { $in: ['pending', 'running'] },
    },
  }
);

module.exports = mongoose.model('RecommendationQueuedJob', queuedJobSchema);
