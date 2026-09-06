const mongoose = require('mongoose');

/**
 * Per-category × contentType trending (all users, background precompute).
 * Collection: music_recommendation_category_trending_scores
 *
 * Isolated from movie recommendation_category_trending_scores.
 *
 * @module recommendation-music/models/CategoryMusicTrendingScore
 */

const categoryMusicTrendingScoreSchema = new mongoose.Schema(
  {
    /** categoryNameMusic */
    category: {
      type: String,
      required: true,
      trim: true,
    },
    contentType: {
      type: String,
      required: true,
      trim: true,
      enum: ['music', 'album', 'clip', 'concert'],
    },
    contentId: {
      type: String,
      required: true,
      trim: true,
    },
    /** Decay-weighted listen / view count in window */
    viewCountRecent: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Average listen duration (seconds) */
    avgListenDuration: {
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
    trendingScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    /**
     * 'trending' — listen_events formula (shared math)
     * 'popularity' — empty-signal catalog fallback
     */
    scoreSource: {
      type: String,
      enum: ['trending', 'popularity'],
      default: 'trending',
      trim: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'music_recommendation_category_trending_scores',
    versionKey: false,
  }
);

categoryMusicTrendingScoreSchema.index(
  { category: 1, contentType: 1, contentId: 1 },
  { unique: true }
);
categoryMusicTrendingScoreSchema.index({
  category: 1,
  contentType: 1,
  trendingScore: -1,
});

module.exports = mongoose.model(
  'MusicRecommendationCategoryTrendingScore',
  categoryMusicTrendingScoreSchema
);
