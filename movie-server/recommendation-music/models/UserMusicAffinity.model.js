const mongoose = require('mongoose');
const { scoringWeights } = require('../config/scoringWeights');

/**
 * Per-user × category × dimension affinity cell (music).
 * Collection: music_recommendation_user_affinity
 *
 * @module recommendation-music/models/UserMusicAffinity
 */

const userMusicAffinitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /** categoryNameMusic */
    category: {
      type: String,
      required: true,
      trim: true,
    },
    dimensionType: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value) => typeof value === 'string' && value.trim().length > 0,
        message: 'dimensionType must be a non-empty string',
      },
    },
    dimensionValue: {
      type: String,
      required: true,
      trim: true,
    },
    affinityScore: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: scoringWeights.decay.maxScore,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'music_recommendation_user_affinity',
    versionKey: false,
  }
);

userMusicAffinitySchema.index(
  { userId: 1, category: 1, dimensionType: 1, dimensionValue: 1 },
  { unique: true }
);
userMusicAffinitySchema.index({ userId: 1, category: 1 });
userMusicAffinitySchema.index({ userId: 1, category: 1, dimensionType: 1 });

module.exports = mongoose.model('MusicRecommendationUserAffinity', userMusicAffinitySchema);
module.exports.KNOWN_DIMENSION_TYPES = Object.freeze(
  Object.values(scoringWeights.dimensionTypes)
);
