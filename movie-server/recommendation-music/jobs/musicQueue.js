/**
 * Dedicated in-process queue for music recommendation jobs.
 * Isolated from movie recommendationQueue (no worker contention).
 *
 * Durable rows still live in recommendation_queued_jobs (keyed by job name);
 * recovery only reloads handlers registered on this queue (music:*).
 *
 * @module recommendation-music/jobs/musicQueue
 */

'use strict';

const { InProcessQueue } = require('../../recommendation/jobs/inProcessQueue');

const musicRecommendationQueue = new InProcessQueue({
  name: 'music-recommendation-queue',
  concurrency: 2,
  defaultMaxAttempts: 3,
  retryDelayMs: 500,
  durable: true,
});

module.exports = {
  musicRecommendationQueue,
};
