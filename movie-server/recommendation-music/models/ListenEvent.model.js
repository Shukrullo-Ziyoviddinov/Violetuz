const mongoose = require('mongoose');
const { scoringWeights } = require('../config/scoringWeights');

/**
 * Listen events for music recommendation (append log).
 * Collection: music_recommendation_listen_events
 *
 * @module recommendation-music/models/ListenEvent
 */

const listenEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contentKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    contentType: {
      type: String,
      required: true,
      trim: true,
      enum: [...scoringWeights.contentTypes],
    },
    contentId: {
      type: String,
      required: true,
      trim: true,
    },
    /** categoryNameMusic */
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    listenedSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    liked: {
      type: Boolean,
      default: false,
    },
    listenedAt: {
      type: Date,
      default: Date.now,
    },
    dimensionSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'music_recommendation_listen_events',
    versionKey: false,
  }
);

listenEventSchema.index({ userId: 1, category: 1, listenedAt: -1 });
listenEventSchema.index({ userId: 1, contentKey: 1, listenedAt: -1 });
listenEventSchema.index({ category: 1, listenedAt: -1 });

const ttlDays = Number(scoringWeights.listenEvent?.ttlDays);
if (Number.isFinite(ttlDays) && ttlDays > 0) {
  listenEventSchema.index(
    { listenedAt: 1 },
    {
      expireAfterSeconds: Math.floor(ttlDays * 24 * 60 * 60),
      name: 'listenedAt_ttl',
    }
  );
} else {
  listenEventSchema.index({ listenedAt: 1 }, { name: 'listenedAt_1' });
}

module.exports = mongoose.model('MusicRecommendationListenEvent', listenEventSchema);
