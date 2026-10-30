'use strict';

const config = require('../config');
const { clamp } = require('../utils/math');

/**
 * Pure score for one (user, short) aggregate.
 * Quick flicks are 0. Completions use the rewatch table.
 * A later full watch replaces the old score because the caller
 * recomputes from the aggregate.
 * @param {{
 *   completions?: number,
 *   totalPlayedMs?: number,
 *   bestPassRatio?: number,
 *   liked?: boolean,
 *   commented?: boolean,
 *   shared?: boolean,
 * }} aggregate
 * @param {{ provisional?: boolean }} [options]
 * @returns {number}
 */
const shortScore = (aggregate, options) => {
  const source = aggregate || {};
  const storedCompletions = source.completions || 0;
  const played = source.totalPlayedMs || 0;
  const ratio = source.bestPassRatio || 0;
  const liked = source.liked === true;
  const commented = source.commented === true;
  const shared = source.shared === true;
  const completions = Math.max(
    storedCompletions,
    ratio >= config.completionPassRatio ? 1 : 0
  );
  const provisional = config.provisionalScoring && options && options.provisional === true;

  if (
    storedCompletions === 0 &&
    played < config.quickFlickMs &&
    !liked &&
    !commented &&
    !shared
  ) {
    return 0;
  }

  let score = 0;
  if (completions >= 1) {
    const step = Math.min(completions, config.maxCompletions);
    score = config.rewatchScore[step];
  } else {
    const bands = config.passRatioScore;
    score = bands[bands.length - 1].score;
    for (let i = 0; i < bands.length; i += 1) {
      if (ratio < bands[i].below) {
        score = bands[i].score;
        break;
      }
    }
  }
  if (provisional && score < 0) score = 0;

  if (liked) {
    const lowWatch = ratio < config.lowWatchPassRatio && completions === 0;
    score += lowWatch ? config.likeBonusLowWatch : config.likeBonus;
  }
  if (commented) score += config.commentBonus;
  if (shared) score += config.shareBonus;

  return clamp(score, config.scoreMin, config.scoreMax);
};

module.exports = {
  shortScore,
};
