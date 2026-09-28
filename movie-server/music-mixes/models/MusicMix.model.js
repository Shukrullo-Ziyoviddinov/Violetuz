const mongoose = require('mongoose');
const { MIX_CONTENT_TYPES } = require('../contentType');

/**
 * Tayyor janr mixi. Sahifa ochilganda shu yerda o'qiladi.
 * Collection: music_mixes
 *
 * home_feed_cache, music_home_feed_cache va bo'lim tavsiyalaridan alohida.
 *
 * @module music-mixes/models/MusicMix
 */

const musicMixSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /** music — qo'shiq mixi. klip — video mixi. Eski qator music. */
    contentType: {
      type: String,
      required: true,
      enum: MIX_CONTENT_TYPES,
      default: 'music',
      trim: true,
    },
    genre: {
      type: String,
      required: true,
      trim: true,
    },
    contentId: {
      type: String,
      required: true,
      trim: true,
    },
    /** 1 = shu janr mixining birinchi o'rni. Ko'p eshitilgan yuqorida. */
    position: {
      type: Number,
      required: true,
      min: 1,
    },
    playCount: {
      type: Number,
      required: true,
      min: 0,
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
    collection: 'music_mixes',
    versionKey: false,
  }
);

musicMixSchema.index({ userId: 1, contentType: 1, genre: 1, contentId: 1 }, { unique: true });
musicMixSchema.index({ userId: 1, contentType: 1, genre: 1, position: 1 });

module.exports = mongoose.model('MusicMix', musicMixSchema);
