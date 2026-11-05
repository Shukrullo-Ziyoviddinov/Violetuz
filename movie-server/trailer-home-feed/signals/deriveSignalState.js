'use strict';
const { trailerHomeFeedWeights } = require('../config/trailerHomeFeedWeights');
const { LIMITS, validateProgressReport, summarizeProgress } = require('../progress/progressProtocol');

// Recompute feature state; never add event points to a stored running total.
const deriveSignalState = ({ actions = [], sessions = [], reaction = null } = {}) => {
  const config = trailerHomeFeedWeights.engagement;
  const validSessions = sessions.map(validateProgressReport);
  const progress = summarizeProgress(validSessions);
  const duration = Math.min(...validSessions.map((s) => s.durationSec));
  const minReal = Math.min(config.meaningfulWatch.minRealSeconds,
    duration * config.meaningfulWatch.minCoverage / LIMITS.maxPlaybackRate);
  const meaningfulWatch = validSessions.length > 0 && progress.coverage >= config.meaningfulWatch.minCoverage
    && progress.realWatchedSeconds >= minReal;
  const playedCoverage = validSessions.reduce((sum, s) => sum + s.totalPlayedSeconds / s.durationSec, 0);
  const currentReaction = reaction?.value === 'like' || reaction?.value === 'dislike' ? reaction.value : 'none';
  const flags = {
    impression: actions.some((action) => action.type === 'impression'),
    open: actions.some((action) => action.type === 'open'),
    openMovie: actions.some((action) => action.type === 'openMovie'),
    meaningfulWatch,
    completion: meaningfulWatch && progress.coverage >= config.completion.minCoverage,
    rewatch: meaningfulWatch && playedCoverage - progress.coverage >= config.rewatch.minExtraCoverage,
    like: currentReaction === 'like',
    dislike: currentReaction === 'dislike',
  };
  const contributions = Object.fromEntries(Object.entries(flags).map(([type, present]) => [type, present ? config.weights[type] || 0 : 0]));
  contributions.rewatch = Math.min(contributions.rewatch, config.maxRewatchBoostPerViewerTrailerDay);
  const positiveScore = Math.min(config.maxPositiveScorePerViewerTrailerDay,
    Object.values(contributions).filter((value) => value > 0).reduce((sum, value) => sum + value, 0));
  return {
    flags, currentReaction, contributions,
    // Dislike targets only this trailer. Other activity cannot override that choice.
    interestScore: flags.dislike ? config.weights.dislike : positiveScore,
    lifetimeWatch: progress,
  };
};

module.exports = { deriveSignalState };
