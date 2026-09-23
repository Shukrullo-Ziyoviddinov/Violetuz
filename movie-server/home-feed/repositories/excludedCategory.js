/**
 * categoryName "anonslar" (va configdagi boshqa istisnolar) o'qishdan tushadi.
 *
 * @module home-feed/repositories/excludedCategory
 */

'use strict';

const { homeFeedWeights } = require('../config/homeFeedWeights');

const excludedCategories = () =>
  (homeFeedWeights.excludedCategories || [])
    .map((name) => String(name || '').trim())
    .filter(Boolean);

/**
 * @param {string} category
 * @returns {boolean}
 */
const isExcludedCategory = (category) =>
  excludedCategories().includes(String(category || '').trim());

/**
 * Mavjud recommendation jadvallaridagi `category` maydoni uchun.
 * @returns {{ category: { $nin: string[] } } | Record<string, never>}
 */
const excludedCategoryMatch = () => {
  const names = excludedCategories();
  if (!names.length) return {};
  return { category: { $nin: names } };
};

module.exports = {
  excludedCategories,
  isExcludedCategory,
  excludedCategoryMatch,
};
