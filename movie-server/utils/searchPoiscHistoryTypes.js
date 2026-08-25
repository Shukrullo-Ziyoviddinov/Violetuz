const { SEARCH_POISC_HISTORY_TYPES } = require('../models/SearchPoiscHistory.model');

/** Bir user uchun saqlanadigan max yozuv */
const MAX_HISTORY_PER_USER = 50;

/**
 * UI/API sinonimlari → model enum.
 * clip → klip, concert → konsert
 */
const normalizeType = (raw) => {
  const type = String(raw || '')
    .trim()
    .toLowerCase();
  if (type === 'clip') return 'klip';
  if (type === 'concert') return 'konsert';
  return type;
};

module.exports = {
  SEARCH_POISC_HISTORY_TYPES,
  MAX_HISTORY_PER_USER,
  normalizeType,
};
