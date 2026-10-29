'use strict';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param {number} minutes
 * @returns {number}
 */
const minutesToMs = (minutes) => minutes * 60 * 1000;

/**
 * @param {number} days
 * @returns {number}
 */
const daysToSeconds = (days) => days * 24 * 60 * 60;

/**
 * @returns {Date}
 */
const nowDate = () => new Date();

module.exports = {
  DAY_MS,
  minutesToMs,
  daysToSeconds,
  nowDate,
};
