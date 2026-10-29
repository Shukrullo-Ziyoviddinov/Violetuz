'use strict';

const config = require('../config');

/**
 * @param {unknown} value
 * @param {string} name
 * @param {{ min: number, max?: number, fallback: number, cap?: boolean }} rule
 * @returns {{ ok: true, value: number }|{ ok: false, error: string }}
 */
const readInteger = (value, name, rule) => {
  if (value == null || value === '') return { ok: true, value: rule.fallback };
  if (Array.isArray(value)) return { ok: false, error: `${name} must be an integer` };
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numeric) || numeric < rule.min) {
    return { ok: false, error: `${name} must be an integer of at least ${rule.min}` };
  }
  if (rule.max != null && numeric > rule.max) {
    if (rule.cap) return { ok: true, value: rule.max };
    return { ok: false, error: `${name} must be at most ${rule.max}` };
  }
  return { ok: true, value: numeric };
};

/**
 * @param {object} query
 * @returns {{ ok: true, value: object }|{ ok: false, errors: string[] }}
 */
const validateFeedQuery = (query) => {
  const source = query && typeof query === 'object' ? query : {};
  const errors = [];

  let sessionId = null;
  if (source.sessionId != null && source.sessionId !== '') {
    if (typeof source.sessionId !== 'string' || Array.isArray(source.sessionId)) {
      errors.push('sessionId must be a string');
    } else {
      sessionId = source.sessionId.trim();
      if (!sessionId || sessionId.length > 80) errors.push('sessionId must be 1 to 80 characters');
    }
  }

  const position = readInteger(source.position, 'position', { min: 0, fallback: 0 });
  if (!position.ok) errors.push(position.error);
  const limit = readInteger(source.limit, 'limit', {
    min: 1,
    max: config.feedBatchSize,
    fallback: config.feedBatchSize,
    cap: true,
  });
  if (!limit.ok) errors.push(limit.error);

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      sessionId,
      position: position.value,
      limit: limit.value,
    },
  };
};

module.exports = {
  validateFeedQuery,
};
