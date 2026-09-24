const mongoose = require('mongoose');

/**
 * Birga eshitilgan qo'shiq juftligi.
 * Collection: music_home_feed_co_occurrence
 *
 * Kino home_feed_movie_co_occurrence va musiqa bo'lim jadvallariga yozilmaydi.
 * Tinglash hodisalaridan keyinroq o'qib, shu kolleksiyaga yoziladi.
 *
 * @module music-home-feed/models/MusicCoOccurrence
 */

const musicCoOccurrenceSchema = new mongoose.Schema(
  {
    contentIdA: {
      type: String,
      required: true,
      trim: true,
    },
    contentIdB: {
      type: String,
      required: true,
      trim: true,
    },
    coListenCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    /** Bir hisob to'plami. Eski juftliklar shu id dan farqi bilan o'chiriladi. */
    batchId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'music_home_feed_co_occurrence',
    versionKey: false,
  }
);

musicCoOccurrenceSchema.index({ contentIdA: 1, contentIdB: 1 }, { unique: true });
musicCoOccurrenceSchema.index({ contentIdA: 1, coListenCount: -1 });

module.exports = mongoose.model('MusicHomeFeedCoOccurrence', musicCoOccurrenceSchema);
