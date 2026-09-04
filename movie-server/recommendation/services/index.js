/**
 * Affinity update, scoring, diversity, precompute, progress, serve.
 * @module recommendation/services
 */

'use strict';

const scoringService = require('./scoring.service');
const affinityService = require('./affinity.service');
const watchEventService = require('./watchEvent.service');
const diversityService = require('./diversity.service');
const precomputeService = require('./precompute.service');
const serveService = require('./serve.service');
const watchHookService = require('./watchHook.service');
const likeHookService = require('./likeHook.service');
const unlikeHookService = require('./unlikeHook.service');
const progressService = require('./progress.service');

module.exports = {
  ...scoringService,
  ...affinityService,
  ...watchEventService,
  ...diversityService,
  ...precomputeService,
  ...serveService,
  ...watchHookService,
  ...likeHookService,
  ...unlikeHookService,
  ...progressService,
};
