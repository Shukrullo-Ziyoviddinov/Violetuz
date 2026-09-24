const mongoose = require('mongoose');
const { sourceTypes } = require('../config/musicHomeFeedWeights');

/**
 * Login foydalanuvchi uchun "Sizga mos musiqalar" natijasi.
 * Collection: music_home_feed_cache
 *
 * home_feed_cache (kino) va music_recommendation_user_recommendations
 * (bo'lim × user) dan alohida.
 *
 * @module music-home-feed/models/MusicHomeFeedCache
 */

const musicHomeFeedCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contentId: {
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
    collection: 'music_home_feed_cache',
    versionKey: false,
  }
);

musicHomeFeedCacheSchema.index({ userId: 1, contentId: 1 }, { unique: true });
musicHomeFeedCacheSchema.index({ userId: 1, position: 1 });

module.exports = mongoose.model('MusicHomeFeedCache', musicHomeFeedCacheSchema);
