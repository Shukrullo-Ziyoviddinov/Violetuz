'use strict';

const config = require('../config');
const { clamp } = require('../utils/math');
const { shortScore } = require('./scoring.service');

/**
 * One aggregate per (user, short). Rewatches update this record.
 * Stored completions follow completionsDelta only.
 * A legacy event with no viewId still counts passRatio >= completionPassRatio
 * as one completion, so older clients keep their score.
 * Scoring may still treat bestPassRatio >= completionPassRatio as one watch.
 * @param {object|null|undefined} previous
 * @param {{
 *   passRatio: number,
 *   playedMsDelta: number,
 *   completionsDelta?: number|null,
 *   liked?: boolean|null,
 *   commented?: boolean|null,
 *   shared?: boolean|null,
 * }} event
 * @returns {object}
 */
const applyWatch = (previous, event) => {
  const prev = previous || {
    bestPassRatio: 0,
    totalPlayedMs: 0,
    completions: 0,
    liked: false,
    commented: false,
    shared: false,
    score: 0,
  };

  let completionsDelta = event.completionsDelta == null ? 0 : event.completionsDelta;
  const legacy = event.viewId == null;
  if (legacy && event.passRatio >= config.completionPassRatio) {
    completionsDelta = Math.max(completionsDelta, 1);
  }

  const next = {
    bestPassRatio: Math.max(prev.bestPassRatio || 0, event.passRatio),
    totalPlayedMs: Math.max(0, (prev.totalPlayedMs || 0) + event.playedMsDelta),
    completions: clamp(
      (prev.completions || 0) + completionsDelta,
      0,
      config.maxCompletions
    ),
    liked: event.liked == null ? prev.liked === true : event.liked === true,
    commented: event.commented == null ? prev.commented === true : event.commented === true,
    shared: event.shared == null ? prev.shared === true : event.shared === true,
  };
  next.score = shortScore(next, { provisional: event.final === false });
  return next;
};

module.exports = {
  applyWatch,
};
