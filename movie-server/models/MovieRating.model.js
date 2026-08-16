const mongoose = require('mongoose');

/**
 * Har bir user → movie bahosi (1–10).
 * Collection: movie_ratings
 * Movie.rating maydoni submit paytida calculate algoritmi bilan yangilanadi.
 */
const movieRatingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    movieId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    /** Foydalanuvchi bahosi 1–10 */
    value: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    /** Baholash paytidagi movie nusxasi (history UI) */
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    /** Shu vote qo‘llangandan keyingi Movie.rating */
    ratingAfter: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'movie_ratings',
  }
);

movieRatingSchema.index({ userId: 1, movieId: 1 }, { unique: true });
movieRatingSchema.index({ userId: 1, updatedAt: -1 });
movieRatingSchema.index({ movieId: 1, updatedAt: -1 });

module.exports = mongoose.model('MovieRating', movieRatingSchema);
