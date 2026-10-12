const mongoose = require('mongoose');

/**
 * Birga eshitilgan albom juftligi.
 * Collection: album_home_feed_co_occurrence
 *
 * music_home_feed_co_occurrence va musiqa bo'lim jadvallariga yozilmaydi.
 *
 * @module album-home-feed/models/AlbumCoOccurrence
 */

const albumCoOccurrenceSchema = new mongoose.Schema(
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
    collection: 'album_home_feed_co_occurrence',
    versionKey: false,
  }
);

albumCoOccurrenceSchema.index({ contentIdA: 1, contentIdB: 1 }, { unique: true });
albumCoOccurrenceSchema.index({ contentIdA: 1, coListenCount: -1 });

module.exports = mongoose.model('AlbumHomeFeedCoOccurrence', albumCoOccurrenceSchema);
