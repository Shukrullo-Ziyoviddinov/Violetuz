const mongoose = require('mongoose');
const { sourceTypes } = require('../config/homeFeedWeights');

/**
 * Login foydalanuvchi uchun "Siz uchun" natijasi.
 * Collection: home_feed_cache
 *
 * recommendation_user_recommendations (bo'lim × user) dan alohida.
 *
 * @module home-feed/models/HomeFeedCache
 */

const homeFeedCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    movieId: {
      type: String,
      required: true,
      trim: true,
    },
    /** 1 = lentaning birinchi o'rni */
    position: {
      type: Number,
      required: true,
      min: 1,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    sourceType: {
      type: String,
      required: true,
      enum: sourceTypes,
      trim: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    /** Bir yozuv to'plami. Eski qatorlar shu id dan farqi bilan o'chiriladi. */
    batchId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'home_feed_cache',
    versionKey: false,
  }
);

homeFeedCacheSchema.index({ userId: 1, movieId: 1 }, { unique: true });
homeFeedCacheSchema.index({ userId: 1, position: 1 });

module.exports = mongoose.model('HomeFeedCache', homeFeedCacheSchema);
