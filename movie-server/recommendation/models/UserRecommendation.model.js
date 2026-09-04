const mongoose = require('mongoose');

/**
 * Precomputed Top-N recommendation cache per user × category.
 * Serve path reads ONLY this collection (indexed) — never full-scans movies.
 *
 * Collection: recommendation_user_recommendations
 *
 * @module recommendation/models/UserRecommendation
 */

const userRecommendationSchema = new mongoose.Schema(
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
    movieId: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    /** Optional rank within the cached Top-N (1 = best) */
    rank: {
      type: Number,
      default: null,
      min: 1,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    /** Replace-batch id — stale rows from older precomputes are deleted by batchId */
    batchId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'recommendation_user_recommendations',
    versionKey: false,
  }
);

userRecommendationSchema.index(
  { userId: 1, category: 1, movieId: 1 },
  { unique: true }
);
/** Primary serve query: diversified order (rank) for a user in a category */
userRecommendationSchema.index({ userId: 1, category: 1, rank: 1 });
/** Secondary: raw score lookups / debugging */
userRecommendationSchema.index({ userId: 1, category: 1, score: -1 });
/** Stale cache cleanup */
userRecommendationSchema.index({ generatedAt: 1 });

module.exports = mongoose.model('RecommendationUserRecommendation', userRecommendationSchema);
