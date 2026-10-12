const mongoose = require('mongoose');
const { sourceTypes } = require('../config/albumHomeFeedWeights');

/**
 * Login foydalanuvchi uchun "Siz uchun albomlar" natijasi.
 * Collection: album_home_feed_cache
 *
 * music_home_feed_cache, home_feed_cache va
 * music_recommendation_user_recommendations dan alohida.
 * Musiqa, klip, konsert yozilmaydi.
 *
 * @module album-home-feed/models/AlbumHomeFeedCache
 */

const albumHomeFeedCacheSchema = new mongoose.Schema(
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
    collection: 'album_home_feed_cache',
    versionKey: false,
  }
);

albumHomeFeedCacheSchema.index({ userId: 1, contentId: 1 }, { unique: true });
albumHomeFeedCacheSchema.index({ userId: 1, position: 1 });

module.exports = mongoose.model('AlbumHomeFeedCache', albumHomeFeedCacheSchema);
