/**
 * @module home-feed/repositories/parseUserId
 */

'use strict';

const mongoose = require('mongoose');

/**
 * @param {string|import('mongoose').Types.ObjectId|null|undefined} value
 * @returns {import('mongoose').Types.ObjectId|null}
 */
const parseUserId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  const str = String(value).trim();
  if (!mongoose.Types.ObjectId.isValid(str)) return null;
  return new mongoose.Types.ObjectId(str);
};

module.exports = {
  parseUserId,
};
