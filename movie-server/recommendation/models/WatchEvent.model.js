const mongoose = require('mongoose');

/**
 * Watch events for the recommendation engine.
 * Fast-growing append log — affinity updates read recent rows, not full history scans.
 *
 * Growth strategy (MongoDB):
 * - Keep hot window via TTL or periodic archive job (e.g. move docs older than 180d
 *   into watch_events_archive_* collections / cold storage).
 * - Optional: time-based sharding key { watchedAt: 1 } when cluster is introduced.
 * - Affinity jobs should prefer { userId, category, watchedAt: -1 } index range queries.
 *
 * Collection: recommendation_watch_events
 *
 * @module recommendation/models/WatchEvent
 */

const watchEventSchema = new mongoose.Schema(
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
    /** movie.categoryName — recommendations are per category */
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    /** 0..1 how much of the title was watched */
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    liked: {
      type: Boolean,
      default: false,
    },
    watchedAt: {
      type: Date,
      default: Date.now,
    },
    /**
     * Optional snapshot of dimension values at watch time
     * (genre/country/actors) so affinity jobs do not re-fetch the movie.
     */
    dimensionSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'recommendation_watch_events',
    versionKey: false,
  }
);

watchEventSchema.index({ userId: 1, category: 1, watchedAt: -1 });
watchEventSchema.index({ userId: 1, movieId: 1, watchedAt: -1 });
watchEventSchema.index({ category: 1, watchedAt: -1 });
/** Archive / retention sweep helper */
watchEventSchema.index({ watchedAt: 1 });

module.exports = mongoose.model('RecommendationWatchEvent', watchEventSchema);
