'use strict';
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');
const { buildPersonalTaste } = require('../taste/buildPersonalTaste');
const { buildMoviePrior, buildGuestMoviePrior } = require('../taste/moviePrior');
const { badRequest } = require('../../utils/errors');

const createPersonalTasteService = ({ readCatalog, readAccountData, readMovieMetadata }) => ({
  async account(userId, { nowMs = Date.now() } = {}) {
    if (!userId || !Number.isFinite(nowMs)) throw badRequest('Account identity and valid clock required');
    const [catalog, raw] = await Promise.all([readCatalog(), readAccountData(userId, { nowMs })]);
    // Defense in depth: a broad/injected reader must not mix another account's history.
    const scoped = (rows) => (rows || []).filter((row) => row?.userId != null && String(row.userId) === String(userId));
    const moviePrior = buildMoviePrior({ affinities: scoped(raw.affinities), progress: scoped(raw.movieProgress), likes: scoped(raw.movieLikes), nowMs });
    return { source: 'account', ...buildPersonalTaste({ catalog, sessions: scoped(raw.sessions),
      actions: scoped(raw.actions), reactions: scoped(raw.reactions), moviePrior, nowMs }) };
  },
  async guest({ sessions = [], actions = [], movieHistory = [] } = {}, { nowMs = Date.now() } = {}) {
    const policy = trailerHomeFeedWeights.personalization;
    if (!Number.isFinite(nowMs) || !Array.isArray(sessions) || sessions.length > policy.maxGuestSessions
      || !Array.isArray(actions) || actions.length > policy.maxGuestActions
      || !Array.isArray(movieHistory) || movieHistory.length > policy.maxGuestMovieHistory) throw badRequest('Invalid guest taste history');
    const catalog = await readCatalog();
    const movieIds = [...new Set(movieHistory.map((row) => row?.m ?? row?.movieId)
      .filter((value) => ['number', 'string'].includes(typeof value) && /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0).map(Number))];
    const movies = movieIds.length ? await readMovieMetadata(movieIds) : [];
    const moviePrior = buildGuestMoviePrior({ history: movieHistory, movies, nowMs });
    // Guest reactions are not invented; the existing LikeButton requires login.
    return { source: 'guest', ...buildPersonalTaste({ catalog, sessions, actions, reactions: [], moviePrior, nowMs }) };
  },
});

// Read-only wiring, loaded explicitly. Existing affinity/progress models are never updated.
const accountPersonalTaste = async (userId, options) => {
  const { readTrailerCatalog } = require('../repositories/trailerCatalog.read');
  const { createPersonalTasteReader } = require('../repositories/personalTaste.read');
  const service = createPersonalTasteService({
    readCatalog: readTrailerCatalog,
    readAccountData: createPersonalTasteReader({
      actionModel: require('../models/TrailerSignalAction.model'),
      trailerProgressModel: require('../models/TrailerProgressSession.model'),
      reactionModel: require('../../models/UserReaction.model'),
      movieAffinityModel: require('../../recommendation/models/UserAffinity.model'),
      movieProgressModel: require('../../recommendation/models/UserMovieProgress.model'),
    }),
  });
  return service.account(userId, options);
};

const guestPersonalTaste = async (history, options) => {
  const { readTrailerCatalog } = require('../repositories/trailerCatalog.read');
  const Movie = require('../../models/Movie.model');
  const service = createPersonalTasteService({
    readCatalog: readTrailerCatalog,
    readMovieMetadata: (ids) => Movie.find({ id: { $in: ids } }).select({ _id: 0, id: 1, filterGenre: 1, filterCountry: 1, actors: 1 }).lean(),
  });
  return service.guest(history, options);
};

module.exports = { createPersonalTasteService, accountPersonalTaste, guestPersonalTaste };
