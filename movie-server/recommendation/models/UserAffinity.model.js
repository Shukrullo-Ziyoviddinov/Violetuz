const mongoose = require('mongoose');
const { scoringWeights } = require('../config/scoringWeights');

/**
 * Per-user × category × dimension affinity cell.
 *
 * dimensionValue examples:
 *   "melodrama"              (genre)
 *   "Hindiston"              (country)
 *   "7"                      (actor id as string)
 *   "Hindiston::jangari"     (genre_country combo)
 *   "jangari::7"             (genre_actor combo)
 *
 * Composite unique key mirrors SQL PRIMARY KEY
 * (user_id, category, dimension_type, dimension_value).
 *
 * Collection: recommendation_user_affinity
 *
 * @module recommendation/models/UserAffinity
 */

const knownDimensionTypes = Object.values(scoringWeights.dimensionTypes);

const userAffinitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /** movie.categoryName */
    category: {
      type: String,
      required: true,
      trim: true,
    },
    dimensionType: {
      type: String,
      required: true,
      trim: true,
      // Keep open for future dimensions (director, language) — validate known ones softly
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
    /** Last reinforcement / decay write — used by applyDecay */
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'recommendation_user_affinity',
    versionKey: false,
  }
);

userAffinitySchema.index(
  { userId: 1, category: 1, dimensionType: 1, dimensionValue: 1 },
  { unique: true }
);
userAffinitySchema.index({ userId: 1, category: 1 });
userAffinitySchema.index({ userId: 1, category: 1, dimensionType: 1 });

module.exports = mongoose.model('RecommendationUserAffinity', userAffinitySchema);
module.exports.KNOWN_DIMENSION_TYPES = Object.freeze(knownDimensionTypes);
