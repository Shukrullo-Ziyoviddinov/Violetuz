'use strict';

// Configuration and read-only catalog. No routes, jobs or automatic DB connections.
const { sourceTypes, trailerHomeFeedWeights } = require('./config/trailerHomeFeedWeights');
const { buildTrailerCatalog } = require('./catalog/buildTrailerCatalog');
const { readTrailerCatalog } = require('./repositories/trailerCatalog.read');
const { deriveSignalState } = require('./signals/deriveSignalState');
const { validateSignalAction } = require('./signals/signalProtocol');
const { buildTrendObservations } = require('./trending/observations');
const { scoreTrailerTrending } = require('./trending/scoreTrending');
const { createTrendingService, computeTrailerTrending } = require('./services/trending.service');
const { buildPersonalTaste, scoreTrailerTaste } = require('./taste/buildPersonalTaste');
const { createPersonalTasteService, accountPersonalTaste, guestPersonalTaste } = require('./services/personalTaste.service');
const { buildCandidatePools } = require('./candidates/buildCandidatePools');
const { createCandidateService, collectAccountTrailerCandidates, collectGuestTrailerCandidates } = require('./services/candidates.service');
const { buildRepetitionState } = require('./rank/repetition');
const { rankTrailerCandidates } = require('./rank/rankCandidates');
const { createFinalRankingService, rankAccountTrailerFeed, rankGuestTrailerFeed } = require('./services/finalRanking.service');

module.exports = { sourceTypes, trailerHomeFeedWeights, buildTrailerCatalog, readTrailerCatalog, deriveSignalState, validateSignalAction,
  buildTrendObservations, scoreTrailerTrending, createTrendingService, computeTrailerTrending,
  buildPersonalTaste, scoreTrailerTaste, createPersonalTasteService, accountPersonalTaste, guestPersonalTaste,
  buildCandidatePools, createCandidateService, collectAccountTrailerCandidates, collectGuestTrailerCandidates,
  buildRepetitionState, rankTrailerCandidates, createFinalRankingService, rankAccountTrailerFeed, rankGuestTrailerFeed };
