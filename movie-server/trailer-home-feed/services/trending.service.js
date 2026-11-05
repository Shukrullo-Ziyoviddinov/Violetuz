'use strict';
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');
const { buildTrendObservations } = require('../trending/observations');
const { scoreTrailerTrending } = require('../trending/scoreTrending');

const createTrendingService = ({ readCatalog, readAccounts, readTrustedGuests = null }) => ({
  async compute({ nowMs = Date.now() } = {}) {
    if (!Number.isFinite(nowMs)) throw new TypeError('Invalid trend clock');
    const config = trailerHomeFeedWeights.trending;
    const catalog = await readCatalog();
    const context = { fromMs: nowMs - config.windowDays * 86400_000, nowMs, catalog };
    const guestsEnabled = config.includeGuestSignals && typeof readTrustedGuests === 'function';
    const [accounts, guests] = await Promise.all([
      readAccounts(context),
      guestsEnabled ? readTrustedGuests(context) : null,
    ]);
    const observations = buildTrendObservations({ ...accounts, catalog, namespace: 'account', nowMs });
    if (guests) observations.push(...buildTrendObservations({ ...guests, catalog, namespace: 'guest', nowMs }));
    return {
      generatedAt: new Date(nowMs).toISOString(), windowStart: new Date(context.fromMs).toISOString(),
      sources: { accounts: 'available', guests: guestsEnabled ? 'verified-reader' : 'not-ingested' },
      trailers: scoreTrailerTrending({ catalog, observations, nowMs }),
    };
  },
});

// Explicit on-demand entry point. No scheduled work, DB writes or registration on import.
const computeTrailerTrending = async (options) => {
  const { readTrailerCatalog } = require('../repositories/trailerCatalog.read');
  const { createTrendReader } = require('../repositories/trailerTrend.read');
  const service = createTrendingService({
    readCatalog: readTrailerCatalog,
    readTrustedGuests: require('../repositories/guestTrailerTrend.read').createGuestTrendReader({
      progressModel: require('../models/GuestTrailerProgressSession.model'),
    }),
    readAccounts: createTrendReader({
      actionModel: require('../models/TrailerSignalAction.model'),
      progressModel: require('../models/TrailerProgressSession.model'),
      reactionModel: require('../../models/UserReaction.model'),
    }),
  });
  return service.compute(options);
};

module.exports = { createTrendingService, computeTrailerTrending };
