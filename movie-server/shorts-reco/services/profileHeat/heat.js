'use strict';

/**
 * Pure activity score for one profile.
 * Likes, comments and rewatches add up over recent days.
 * Each day older multiplies by dailyDecay, and days outside the window add nothing.
 * Nothing here reads the database or the feed.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const ACTIVITY = Object.freeze({
  like: 1,
  comment: 1,
  rewatch: 1,
  dailyDecay: 0.85,
  windowDays: 30,
});

/**
 * @param {unknown} day
 * @returns {number|null}
 */
const dayIndex = (day) => {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  const date = Number(day.slice(8, 10));
  const utc = Date.UTC(year, month - 1, date);
  if (Number.isNaN(utc)) return null;
  const check = new Date(utc);
  if (
    check.getUTCFullYear() !== year
    || check.getUTCMonth() !== month - 1
    || check.getUTCDate() !== date
  ) {
    return null;
  }
  return Math.floor(utc / DAY_MS);
};

/**
 * @param {unknown} now
 * @returns {number|null}
 */
const todayIndex = (now) => {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) return null;
  return Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / DAY_MS);
};

/**
 * @param {unknown} value
 * @returns {number}
 */
const count = (value) => (Number.isSafeInteger(value) && value > 0 ? value : 0);

/**
 * A stored day still belongs to the recent window.
 * @param {unknown} day
 * @param {Date} now
 * @returns {boolean}
 */
const withinWindow = (day, now) => {
  const today = todayIndex(now);
  const index = dayIndex(day);
  if (today == null || index == null) return false;
  const age = today - index;
  return age >= 0 && age < ACTIVITY.windowDays;
};

/**
 * Weight of one stored day. Days outside the window weigh nothing.
 * @param {unknown} day
 * @param {Date} now
 * @returns {number}
 */
const dayWeight = (day, now) => {
  const today = todayIndex(now);
  const index = dayIndex(day);
  if (today == null || index == null) return 0;
  const age = today - index;
  if (age < 0 || age >= ACTIVITY.windowDays) return 0;
  return ACTIVITY.dailyDecay ** age;
};

/**
 * @param {unknown} days
 * @param {Date} now
 * @returns {number}
 */
const activityScore = (days, now) => {
  if (todayIndex(now) == null || !Array.isArray(days)) return 0;

  let total = 0;
  for (let i = 0; i < days.length; i += 1) {
    const row = days[i];
    if (!row) continue;
    const weight = dayWeight(row.day, now);
    if (weight === 0) continue;
    const points = count(row.likes) * ACTIVITY.like
      + count(row.comments) * ACTIVITY.comment
      + count(row.rewatches) * ACTIVITY.rewatch;
    total += points * weight;
  }
  return total;
};

module.exports = {
  ACTIVITY,
  activityScore,
  dayWeight,
  withinWindow,
};
