'use strict';

const scoring = require('./scoring.service');
const affinity = require('./affinity.service');
const listenEvent = require('./listenEvent.service');
const diversity = require('./diversity.service');
const precompute = require('./precompute.service');
const serve = require('./serve.service');
const likeHook = require('./likeHook.service');
const unlikeHook = require('./unlikeHook.service');
const progress = require('./progress.service');

const namespaces = Object.freeze({
  scoring,
  affinity,
  listenEvent,
  diversity,
  precompute,
  serve,
  likeHook,
  unlikeHook,
  progress,
});

const api = Object.freeze({
  scoreContent: scoring.scoreContent,
  scoreContents: scoring.scoreContents,
  scoreColdStart: scoring.scoreColdStart,

  resolveBoost: affinity.resolveBoost,
  applyListenToAffinities: affinity.applyListenToAffinities,
  applyLikeToAffinities: affinity.applyLikeToAffinities,
  applyUnlikeToAffinities: affinity.applyUnlikeToAffinities,

  recordListenEvent: listenEvent.recordListenEvent,

  diversifyRecommendations: diversity.diversifyRecommendations,

  precomputeUserCategoryRecommendations: precompute.precomputeUserCategoryRecommendations,
  getRecommendationsByCategory: serve.getRecommendationsByCategory,
  reportMusicProgress: progress.reportMusicProgress,

  enqueueMusicLikeHook: likeHook.enqueueMusicLikeHook,
  enqueueMusicUnlikeHook: unlikeHook.enqueueMusicUnlikeHook,
});

module.exports = {
  ...namespaces,
  ...api,
};
