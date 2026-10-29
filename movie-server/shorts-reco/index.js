'use strict';

const mongoose = require('mongoose');
const { ensureRecoIndexes } = require('./repositories/indexes');
const { createCatalogSync } = require('./services/catalogSync.service');
const { createWatchEventService } = require('./services/watchEvent.service');
const { createFeedService } = require('./services/feed/feed.service');
const { createHydrator } = require('./services/hydrate.service');
const { createHttpHandlers } = require('./controllers/http');
const { createRouter } = require('./routes');

/**
 * @param {import('express').Request} req
 * @returns {string|null}
 */
const userIdFromRequest = (req) => {
  const id = req && req.authUser && req.authUser._id;
  if (id == null || id === '') return null;
  return String(id);
};

/**
 * Isolated shorts recommendation module.
 * Mount the router under the existing /api and /api/v1 prefixes.
 * Call startCatalogSync only after the database is connected.
 *
 * @param {{
 *   connection?: import('mongoose').Connection,
 *   db?: import('mongoose').Connection,
 *   authMiddleware?: Function,
 *   getUserId?: Function,
 *   logger?: Console,
 * }} [options]
 */
const createShortsRecoModule = (options = {}) => {
  const connection = options.connection || options.db || mongoose.connection;
  const logger = options.logger || console;
  const sync = createCatalogSync({ connection, logger });
  const watchEvents = createWatchEventService({ connection, logger });
  const feed = createFeedService({ connection, logger });
  const hydrate = createHydrator(connection, logger);
  const handlers = createHttpHandlers({
    ingest: (input) => watchEvents.ingest(input),
    serveFeed: (input) => feed.serveFeed(input),
    hydrate,
    getUserId: options.getUserId || userIdFromRequest,
  });
  const router = createRouter({
    postEvent: handlers.postEvent,
    getFeed: handlers.getFeed,
    authMiddleware: options.authMiddleware,
  });

  return {
    router,
    ensureIndexes: () => ensureRecoIndexes(connection),
    startCatalogSync: () => {
      ensureRecoIndexes(connection)
        .catch((error) => {
          logger.error(
            'shorts-reco indexes failed',
            error && error.message ? error.message : error
          );
        })
        .finally(() => sync.start());
    },
    stopCatalogSync: () => sync.stop(),
    runCatalogSync: () => sync.runOnce(),
    ingestEvent: (input) => watchEvents.ingest(input),
    serveFeed: (input) => feed.serveFeed(input),
  };
};

module.exports = {
  createShortsRecoModule,
};
