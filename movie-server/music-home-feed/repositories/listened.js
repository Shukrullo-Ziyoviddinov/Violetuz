/**
 * "Tinglandi" — recommendation-music dagi tayyor formula.
 * 10 soniya, yoki trek 10 soniyadan qisqa bo'lsa 80 foiz.
 * Shu modul formula yozmaydi.
 *
 * @module music-home-feed/repositories/listened
 */

'use strict';

const { isListenGateOpen } = require('../../recommendation-music/utils/progressRules');

/**
 * @param {number} listenedSeconds
 * @param {number} [completionRate]
 * @param {number|null} [durationSec]
 * @returns {boolean}
 */
const isListenedTrack = (listenedSeconds, completionRate = 0, durationSec = null) =>
  isListenGateOpen(listenedSeconds, completionRate, durationSec);

module.exports = {
  isListenedTrack,
};
