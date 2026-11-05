'use strict';
const { validateCandidateContext } = require('../candidates/buildCandidatePools');
const { buildRepetitionState } = require('../rank/repetition');
const { rankTrailerCandidates } = require('../rank/rankCandidates');
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');

const createFinalRankingService = ({ readProfile, readHistory, collectCandidates }) => ({
  async rank({ sessionSeed, nowMs = Date.now(), limit } = {}) {
    validateCandidateContext({ sessionSeed, nowMs });
    if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1 || limit > trailerHomeFeedWeights.feed.size)) throw new TypeError('Invalid trailer feed size');
    const [profile, history] = await Promise.all([readProfile({ nowMs }), readHistory({ nowMs })]);
    const repetitionState = buildRepetitionState({ ...history, nowMs });
    const excludeKeys = [...new Set([...(profile?.excludedTrailerKeys || []), ...repetitionState.hardExcludedKeys])];
    const candidateSnapshot = await collectCandidates({ profile, excludeKeys, sessionSeed, nowMs });
    return rankTrailerCandidates({ candidateSnapshot, profile, repetitionState, sessionSeed, nowMs, limit });
  },
});

const candidatesForProfile = ({ profile, ...context }) => {
  const { createDefaultCandidateService } = require('./candidates.service');
  return createDefaultCandidateService(async () => profile).collect(context);
};

const rankAccountTrailerFeed = async (userId, options) => {
  if (!userId) throw new TypeError('Account identity is required');
  const { accountPersonalTaste } = require('./personalTaste.service');
  const { createRepetitionReader } = require('../repositories/repetition.read');
  const read = createRepetitionReader({
    progressModel: require('../models/TrailerProgressSession.model'),
    actionModel: require('../models/TrailerSignalAction.model'),
    reactionModel: require('../../models/UserReaction.model'),
  });
  return createFinalRankingService({
    readProfile: ({ nowMs }) => accountPersonalTaste(userId, { nowMs }),
    readHistory: (context) => read(userId, context), collectCandidates: candidatesForProfile,
  }).rank(options);
};

const rankGuestTrailerFeed = async (history = {}, options) => {
  const { guestPersonalTaste } = require('./personalTaste.service');
  return createFinalRankingService({
    readProfile: ({ nowMs }) => guestPersonalTaste(history, { nowMs }),
    readHistory: async () => ({ sessions: history.sessions || [], actions: history.actions || [], reactions: [] }),
    collectCandidates: candidatesForProfile,
  }).rank(options);
};

module.exports = { createFinalRankingService, rankAccountTrailerFeed, rankGuestTrailerFeed };
