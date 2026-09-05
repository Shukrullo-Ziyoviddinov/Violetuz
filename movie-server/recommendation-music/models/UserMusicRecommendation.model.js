const mongoose = require('mongoose');

/**
 * Precomputed Top-N music recommendation cache per user × categoryNameMusic.
 * Collection: music_recommendation_user_recommendations
 *
 * @module recommendation-music/models/UserMusicRecommendation
 */

const userMusicRecommendationSchema = new mongoose.Schema(
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
    contentKey: {
      type: String,
      required: true,
      trim: true,
    },
    contentType: {
      type: String,
      required: true,
      trim: true,
    },
    contentId: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    rank: {
      type: Number,
      default: null,
      min: 1,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    batchId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'music_recommendation_user_recommendations',
    versionKey: false,
  }
);

userMusicRecommendationSchema.index(
  { userId: 1, category: 1, contentKey: 1 },
  { unique: true }
);
userMusicRecommendationSchema.index({ userId: 1, category: 1, contentType: 1, rank: 1 });
userMusicRecommendationSchema.index({ userId: 1, category: 1, rank: 1 });
userMusicRecommendationSchema.index({ userId: 1, category: 1, score: -1 });
userMusicRecommendationSchema.index({ generatedAt: 1 });

module.exports = mongoose.model(
  'MusicRecommendationUserRecommendation',
  userMusicRecommendationSchema
);
