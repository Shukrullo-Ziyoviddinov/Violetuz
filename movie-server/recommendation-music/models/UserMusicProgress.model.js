const mongoose = require('mongoose');
const { scoringWeights } = require('../config/scoringWeights');

/**
 * Per-user × content listen progress.
 * Collection: music_recommendation_user_progress
 *
 * contentKey:
 *   music:{id} | clip:{id} | concert:{id} | album:{id}
 *
 * Single (music/clip/concert):
 *   listenedSeconds / completionRate — MAX upsert (bitta timeline).
 *
 * Album:
 *   trackSeconds[songId] — har trek MAX
 *   listenedSeconds = sum(trackSeconds)
 *   completionRate = listenedSeconds / albumDurationSec
 *
 * @module recommendation-music/models/UserMusicProgress
 */

const userMusicProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contentKey: {
      type: String,
      required: true,
      trim: true,
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
    },
    listenedSeconds: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    /**
     * Albom: har bir trek bo‘yicha MAX tinglangan sekund.
     * listenedSeconds = sum(trackSeconds values).
     * Oddiy music/clip/concert da bo‘sh.
     */
    trackSeconds: {
      type: Map,
      of: Number,
      default: undefined,
    },
    /** Albom: har trek davomiyligi (audio metadata, sekund) */
    trackDurations: {
      type: Map,
      of: Number,
      default: undefined,
    },
    /** Albom jami davomiylik (sekund) — ma’lum bo‘lsa completionRate uchun */
    albumDurationSec: {
      type: Number,
      default: null,
      min: 0,
    },
    completionRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1,
    },
    lastAffinityCompletion: {
      type: Number,
      default: -1,
      min: -1,
      max: 1,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'music_recommendation_user_progress',
    versionKey: false,
  }
);

userMusicProgressSchema.index({ userId: 1, contentKey: 1 }, { unique: true });
userMusicProgressSchema.index({ userId: 1, category: 1, updatedAt: -1 });

module.exports = mongoose.model('MusicRecommendationUserProgress', userMusicProgressSchema);
