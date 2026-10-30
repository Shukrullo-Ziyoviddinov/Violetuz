'use strict';

const config = require('../config');
const collections = require('../config/collections');

const movieType = collections.existing.shortsVideos.type;
const musicType = collections.existing.musicShorts.type;

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
 * Page cards ask for one type. The scroll feed stays on GET /feed.
 * @param {object} query
 * @returns {{ ok: true, value: object }|{ ok: false, errors: string[] }}
 */
const validateShelfQuery = (query) => {
  const source = query && typeof query === 'object' ? query : {};
  const errors = [];
  const type = typeof source.type === 'string' ? source.type.trim() : '';
  if (type !== movieType && type !== musicType) {
    errors.push('type must be movieShorts or musicshorts');
  }

  const block = readInteger(source.block, 'block', { min: 0, max: 20, fallback: 0 });
  if (!block.ok) errors.push(block.error);
  const limit = readInteger(source.limit, 'limit', {
    min: 1,
    max: config.shelfBlockSize,
    fallback: config.shelfBlockSize,
    cap: true,
  });
  if (!limit.ok) errors.push(limit.error);

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: { type, block: block.value, limit: limit.value },
  };
};

module.exports = {
  validateShelfQuery,
};
