const mongoose = require('mongoose');

/**
 * Birga ko'rilgan kino juftligi.
 * Collection: home_feed_movie_co_occurrence
 *
 * Bo'lim algoritmi jadvallariga yozilmaydi. watch_events dan keyinroq
 * o'qib, shu kolleksiyaga yoziladi.
 *
 * @module home-feed/models/MovieCoOccurrence
 */

const movieCoOccurrenceSchema = new mongoose.Schema(
  {
    movieIdA: {
      type: String,
      required: true,
      trim: true,
    },
    movieIdB: {
      type: String,
      required: true,
      trim: true,
    },
    coWatchCount: {
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
    collection: 'home_feed_movie_co_occurrence',
    versionKey: false,
  }
);

movieCoOccurrenceSchema.index({ movieIdA: 1, movieIdB: 1 }, { unique: true });
movieCoOccurrenceSchema.index({ movieIdA: 1, coWatchCount: -1 });

module.exports = mongoose.model('HomeFeedMovieCoOccurrence', movieCoOccurrenceSchema);
