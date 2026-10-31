'use strict';

const config = require('../../config');
const { artistProfileRef } = require('./profileRef');
const { ACTIVITY, withinWindow } = require('./heat');

const HEAT_FIELDS = ['likes', 'comments', 'rewatches'];
const PASS_FIELDS = ['passes'];

/**
 * What one accepted watch adds.
 * A rewatch is a completion after the first. The first full watch is not one.
 * Not finishing and skipping are the same personal pass, and only on a final event.
 * @param {{ previous?: object|null, next?: object|null, event?: object|null }} input
 * @returns {{ likes: number, comments: number, rewatches: number, passes: number }}
 */
const profileSignals = (input) => {
  const source = input || {};
  const previous = source.previous || null;
  const next = source.next || null;
  const event = source.event || null;
  const oldCompletions = previous && previous.completions ? previous.completions : 0;
  const newCompletions = next && next.completions ? next.completions : 0;
  const ratio = event && typeof event.passRatio === 'number' ? event.passRatio : 0;
  const finished = ratio >= config.completionPassRatio || newCompletions > oldCompletions;

  return {
    likes: next && next.liked === true && !(previous && previous.liked === true) ? 1 : 0,
    comments: next && next.commented === true && !(previous && previous.commented === true) ? 1 : 0,
    rewatches: Math.max(0, newCompletions - Math.max(oldCompletions, 1)),
    passes: event && event.final !== false && !finished ? 1 : 0,
  };
};

/**
 * @param {unknown} value
 * @returns {string|null}
 */
const utcDay = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}-${day}`;
};

/**
 * @param {object[]|null|undefined} days
 * @param {string} day
 * @param {Record<string, number>} amounts
 * @param {string[]} fields
 * @param {Date} now
 * @returns {object[]}
 */
const bumpDays = (days, day, amounts, fields, now) => {
  const next = [];
  let found = false;
  const source = Array.isArray(days) ? days : [];

  for (let i = 0; i < source.length; i += 1) {
    const row = source[i];
    if (!row || !withinWindow(row.day, now)) continue;
    const copy = { day: row.day };
    for (let j = 0; j < fields.length; j += 1) {
      const field = fields[j];
      copy[field] = row[field] || 0;
    }
    if (row.day === day) {
      found = true;
      for (let j = 0; j < fields.length; j += 1) {
        const field = fields[j];
        copy[field] += amounts[field] || 0;
      }
    }
    next.push(copy);
  }

  if (!found) {
    const created = { day };
    for (let j = 0; j < fields.length; j += 1) {
      const field = fields[j];
      created[field] = amounts[field] || 0;
    }
    next.push(created);
  }
  return next;
};

/**
 * @param {Console|null|undefined} logger
 * @param {unknown} error
 */
const logFailure = (logger, error) => {
  if (!logger || typeof logger.error !== 'function') return;
  try {
    logger.error(
      'shorts-reco profile signal failed',
      error && error.message ? error.message : error
    );
  } catch (ignore) {
    // A broken logger must not change the watch result.
  }
};

/**
 * @param {{ repo?: object|null, logger?: Console|null }} options
 */
const createProfileSignalRecorder = (options = {}) => {
  const repo = options.repo || null;
  const logger = options.logger || null;

  return async (input) => {
    if (!repo) return;
    try {
      const source = input || {};
      const ref = artistProfileRef(source.catalog && source.catalog.artistId);
      if (!ref || typeof source.userId !== 'string' || !source.userId.trim()) return;

      const signal = profileSignals(source);
      const at = source.event && source.event.ts instanceof Date
        ? source.event.ts
        : new Date(source.event && source.event.ts);
      const day = utcDay(at);
      if (!day) return;

      if (signal.likes > 0 || signal.comments > 0 || signal.rewatches > 0) {
        const current = await repo.findHeat(ref.key);
        await repo.saveHeat({
          key: ref.key,
          kind: ref.kind,
          id: ref.id,
          days: bumpDays(current && current.days, day, signal, HEAT_FIELDS, at),
          updatedAt: at,
        });
      }

      if (signal.passes > 0) {
        const current = await repo.findUserSlowdown(source.userId, ref.key);
        await repo.saveUserSlowdown({
          userId: source.userId,
          key: ref.key,
          kind: ref.kind,
          id: ref.id,
          days: bumpDays(current && current.days, day, signal, PASS_FIELDS, at),
          updatedAt: at,
        });
      }
    } catch (error) {
      logFailure(logger, error);
    }
  };
};

module.exports = {
  profileSignals,
  createProfileSignalRecorder,
};
