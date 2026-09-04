const mongoose = require('mongoose');
const { scoringWeights } = require('../config/scoringWeights');

/**
 * Watch events for the recommendation engine.
 * Fast-growing append log — affinity updates read recent rows, not full history scans.
 *
 * Growth strategy (MongoDB):
 * - TTL on watchedAt (scoringWeights.watchEvent.ttlDays, default 180).
 *   Affinity cells, UserReaction likes, and UserMovieProgress are NOT deleted by this.
 * - Optional later: archive to watch_events_archive_* before TTL if analytics need history.
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

const ttlDays = Number(scoringWeights.watchEvent?.ttlDays);
if (Number.isFinite(ttlDays) && ttlDays > 0) {
  /** Mongo TTL monitor deletes when watchedAt + expireAfterSeconds < now */
  watchEventSchema.index(
    { watchedAt: 1 },
    {
      expireAfterSeconds: Math.floor(ttlDays * 24 * 60 * 60),
      name: 'watchedAt_ttl',
    }
  );
} else {
  watchEventSchema.index({ watchedAt: 1 }, { name: 'watchedAt_1' });
}

module.exports = mongoose.model('RecommendationWatchEvent', watchEventSchema);
