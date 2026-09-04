const mongoose = require('mongoose');

/**
 * Per-user × movie watch progress (single row — always keep MAX values).
 * Collection: recommendation_user_movie_progress
 *
 * @module recommendation/models/UserMovieProgress
 */

const userMovieProgressSchema = new mongoose.Schema(
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
    /** movie.categoryName */
    category: {
      type: String,
      required: true,
      trim: true,
    },
    /** Haqiqiy yig'ilgan tomosha sekundlari (max) */
    watchedSeconds: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    /** 0..1 eng yuqori completion (max) */
    completionRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1,
    },
    /**
     * Oxirgi marta affinity ga yuborilgan completion (-1 = hali yo'q).
     * Birinchi affinity fail bo'lsa qayta urinish uchun.
     */
    lastAffinityCompletion: {
      type: Number,
      default: -1,
      min: -1,
      max: 1,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'recommendation_user_movie_progress',
    versionKey: false,
  }
);

userMovieProgressSchema.index({ userId: 1, movieId: 1 }, { unique: true });
userMovieProgressSchema.index({ userId: 1, category: 1, updatedAt: -1 });

module.exports = mongoose.model('RecommendationUserMovieProgress', userMovieProgressSchema);
