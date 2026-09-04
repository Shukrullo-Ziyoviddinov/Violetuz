const mongoose = require('mongoose');

/**
 * Per-category trending aggregates (all users, background precompute).
 * Collection: recommendation_category_trending_scores
 *
 * SQL analog: category_trending_scores PRIMARY KEY (category, movie_id)
 *
 * @module recommendation/models/CategoryTrendingScore
 */

const categoryTrendingScoreSchema = new mongoose.Schema(
  {
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
    /** Oxirgi window ichidagi ko'rishlar soni (recency-weighted count) */
    viewCountRecent: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** O'rtacha tomosha muddati (sekund) */
    avgWatchDuration: {
      type: Number,
      default: 0,
      min: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** 0..1 */
    completionRateAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    /** Normallashtirilgan kombinatsiya (0..1 tipik) */
    trendingScore: {
      type: Number,
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
    collection: 'recommendation_category_trending_scores',
    versionKey: false,
  }
);

categoryTrendingScoreSchema.index({ category: 1, movieId: 1 }, { unique: true });
/** SELECT TOP-N by category */
categoryTrendingScoreSchema.index({ category: 1, trendingScore: -1 });

module.exports = mongoose.model(
  'RecommendationCategoryTrendingScore',
  categoryTrendingScoreSchema
);
