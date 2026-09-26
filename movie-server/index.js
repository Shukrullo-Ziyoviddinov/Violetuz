require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');

const startServer = async () => {
  try {
    await connectDB();

    // Recommendation jobs: handlers register via routes; cron after DB is ready
    const {
      startTrendingPrecomputeScheduler,
      startRecommendationQueueRecovery,
    } = require('./recommendation/jobs');
    const {
      startMusicRecommendationQueueRecovery,
      startMusicTrendingPrecomputeScheduler,
    } = require('./recommendation-music/jobs');

    await startRecommendationQueueRecovery();
    await startMusicRecommendationQueueRecovery();

    startTrendingPrecomputeScheduler({
      runImmediately: true,
      initialDelayMs: 5_000,
    });
    startMusicTrendingPrecomputeScheduler({
      runImmediately: true,
      initialDelayMs: 8_000,
    });

    const { startHomeFeedSchedulers } = require('./home-feed/jobs');
    startHomeFeedSchedulers({
      feed: { runImmediately: true, initialDelayMs: 15_000 },
      coOccurrence: { runImmediately: true, initialDelayMs: 20_000 },
    });

    const { startMusicHomeFeedSchedulers } = require('./music-home-feed/jobs');
    startMusicHomeFeedSchedulers({
      feed: { runImmediately: true, initialDelayMs: 25_000 },
      coListen: { runImmediately: true, initialDelayMs: 30_000 },
    });

    const { startMusicMixPrecomputeScheduler } = require('./music-mixes/jobs');
    startMusicMixPrecomputeScheduler({
      runImmediately: true,
      initialDelayMs: 35_000,
    });

    app.listen(PORT, () => {
      console.log(`Movie server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
