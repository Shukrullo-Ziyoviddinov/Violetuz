/**
 * Mix martasini yozish. Tinglandi formulasi chaqirilmaydi.
 *
 * @module music-mixes/services
 */

'use strict';

const { isQualifiedMixPlay } = require('./qualifyPlay');
const { recordMixPlay } = require('./recordPlay.service');
const { assembleMixes, buildUserMixes } = require('./mixEngine');
const { listReadyMixes } = require('./getMixes.service');
const { createUserMixShare } = require('./createMixShare.service');
const { getMixShareByToken } = require('./getMixShare.service');

module.exports = {
  isQualifiedMixPlay,
  recordMixPlay,
  assembleMixes,
  buildUserMixes,
  listReadyMixes,
  createUserMixShare,
  getMixShareByToken,
};
