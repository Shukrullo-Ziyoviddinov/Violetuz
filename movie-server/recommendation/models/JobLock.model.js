const mongoose = require('mongoose');

/**
 * Lightweight Mongo lock for multi-instance cron safety (Bull/Redis o‘rniga MVP).
 * Collection: recommendation_job_locks
 *
 * @module recommendation/models/JobLock
 */

const jobLockSchema = new mongoose.Schema(
  {
    jobName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    owner: {
      type: String,
      required: true,
      trim: true,
    },
    lockedUntil: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'recommendation_job_locks',
    versionKey: false,
  }
);

jobLockSchema.index({ lockedUntil: 1 });

module.exports = mongoose.model('RecommendationJobLock', jobLockSchema);
