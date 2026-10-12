/**
 * "Tinglandi" — recommendation-music dagi tayyor formula.
 * Shu modul formula yozmaydi.
 *
 * @module album-home-feed/repositories/listened
 */

'use strict';

const { isListenGateOpen } = require('../../recommendation-music/utils/progressRules');

/**
 * @param {number} listenedSeconds
 * @param {number} [completionRate]
 * @param {number|null} [durationSec]
 * @returns {boolean}
 */
const isListenedAlbum = (listenedSeconds, completionRate = 0, durationSec = null) =>
  isListenGateOpen(listenedSeconds, completionRate, durationSec);

module.exports = {
  isListenedAlbum,
};
