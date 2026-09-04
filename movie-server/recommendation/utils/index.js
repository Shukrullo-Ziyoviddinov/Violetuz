/**
 * Pure helpers: normalize, clamp, decay, combo keys, movie signals.
 *
 * @module recommendation/utils
 */

'use strict';

const values = require('./values');
const comboKeys = require('./comboKeys');
const clamp = require('./clamp');
const decay = require('./decay');
const movieSignals = require('./movieSignals');

module.exports = {
  ...values,
  ...comboKeys,
  ...clamp,
  ...decay,
  ...movieSignals,
};
