'use strict';

const { toFiniteNumber, parseShortCatalogId } = require('../utils/keys');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * @param {unknown} value
 * @returns {boolean}
 */
const isBoolean = (value) => typeof value === 'boolean';

/**
 * @param {unknown} body
 * @param {Date} [now]
 * @returns {{ ok: true, value: object }|{ ok: false, errors: string[] }}
 */
const validateWatchEvent = (body, now = new Date()) => {
  const source = body && typeof body === 'object' ? body : {};
  const errors = [];

  const eventId = typeof source.eventId === 'string' ? source.eventId.trim() : '';
  if (!UUID_PATTERN.test(eventId)) errors.push('eventId must be a uuid');

  let shortId = source.shortId;
  if (typeof shortId === 'string' && parseShortCatalogId(shortId.trim())) {
    shortId = shortId.trim();
  } else {
    const numericId = toFiniteNumber(shortId);
    if (numericId == null || numericId < 0) errors.push('shortId must be a non-negative id');
    else shortId = numericId;
  }

  const passRatio = source.passRatio;
  if (typeof passRatio !== 'number' || !Number.isFinite(passRatio) || passRatio < 0 || passRatio > 1) {
    errors.push('passRatio must be between 0 and 1');
  }

  const playedMsDelta = source.playedMsDelta;
  if (
    typeof playedMsDelta !== 'number' ||
    !Number.isFinite(playedMsDelta) ||
    playedMsDelta < 0
  ) {
    errors.push('playedMsDelta must be a non-negative number');
  }

  let completionsDelta = null;
  if (source.completionsDelta != null) {
    if (
      typeof source.completionsDelta !== 'number' ||
      !Number.isInteger(source.completionsDelta) ||
      source.completionsDelta < 0
    ) {
      errors.push('completionsDelta must be a non-negative integer');
    } else {
      completionsDelta = source.completionsDelta;
    }
  }

  const flags = {};
  ['liked', 'commented', 'shared'].forEach((name) => {
    if (source[name] == null) {
      flags[name] = null;
      return;
    }
    if (!isBoolean(source[name])) errors.push(`${name} must be a boolean`);
    else flags[name] = source[name];
  });

  let ts = now;
  if (source.ts != null) {
    const parsed = typeof source.ts === 'number' ? new Date(source.ts) : new Date(source.ts);
    if (Number.isNaN(parsed.getTime())) errors.push('ts must be a valid time');
    else ts = parsed;
  }

  const final = source.final == null ? true : source.final;
  if (typeof final !== 'boolean') errors.push('final must be a boolean');

  let viewId = null;
  if (source.viewId != null && source.viewId !== '') {
    if (typeof source.viewId !== 'string' || !UUID_PATTERN.test(source.viewId.trim())) {
      errors.push('viewId must be a uuid');
    } else {
      viewId = source.viewId.trim();
    }
  }

  let seq = null;
  if (source.seq != null) {
    if (typeof source.seq !== 'number' || !Number.isInteger(source.seq) || source.seq < 1) {
      errors.push('seq must be an integer of at least 1');
    } else {
      seq = source.seq;
    }
  }
  if (viewId && seq == null) errors.push('seq is required when viewId is set');
  if (!viewId && seq != null) errors.push('viewId is required when seq is set');

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      eventId,
      shortId,
      passRatio,
      playedMsDelta,
      completionsDelta,
      liked: flags.liked,
      commented: flags.commented,
      shared: flags.shared,
      ts,
      final,
      viewId,
      seq,
    },
  };
};

module.exports = {
  validateWatchEvent,
};
