/**
 * Mavjud recommendation jadvallaridan faqat o'qish.
 * insert / update / delete yo'q.
 *
 * @module home-feed/repositories
 */

'use strict';

const { listPersonalCandidates } = require('./sectionRecommendations.read');
const { listTrendingCandidates } = require('./trending.read');
const { listWatchProgress, isWatchedProgress } = require('./watchProgress.read');
const {
  excludedCategories,
  isExcludedCategory,
} = require('./excludedCategory');

module.exports = {
  listPersonalCandidates,
  listTrendingCandidates,
  listWatchProgress,
  isWatchedProgress,
  excludedCategories,
  isExcludedCategory,
};
