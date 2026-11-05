'use strict'; // eslint-disable-line strict -- Standalone CommonJS browser/server protocol.

const ACTION_TYPES = Object.freeze(['impression', 'open', 'openMovie']);
const SURFACES = Object.freeze(['home', 'channel', 'similar', 'trailer-page']);

const parseTrailerIdentity = ({ movieId, trailerId } = {}) => {
  const ids = [movieId, trailerId].map((value) => {
    if (!['number', 'string'].includes(typeof value) || !/^\d+$/.test(String(value))) throw new TypeError('Invalid trailer identity');
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) throw new TypeError('Invalid trailer identity');
    return id;
  });
  return { movieId: ids[0], trailerId: ids[1] };
};

const validateSignalAction = (input, impressionPolicy = { minVisibleRatio: 0.5, minVisibleMs: 1000 }) => {
  const ids = parseTrailerIdentity(input);
  if (!ACTION_TYPES.includes(input.type)) throw new TypeError('Unsupported trailer action');
  if (!SURFACES.includes(input.surface)) throw new TypeError('Invalid trailer surface');
  if (typeof input.eventId !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(input.eventId)) throw new TypeError('Invalid eventId');
  const result = { ...ids, eventId: input.eventId, type: input.type, surface: input.surface };
  if (input.type === 'impression') {
    if (typeof input.visibleRatio !== 'number' || !Number.isFinite(input.visibleRatio) || input.visibleRatio > 1
      || input.visibleRatio < impressionPolicy.minVisibleRatio
      || typeof input.visibleMs !== 'number' || !Number.isFinite(input.visibleMs) || input.visibleMs < impressionPolicy.minVisibleMs) {
      throw new TypeError('Impression needs sufficient visible area and foreground time');
    }
    result.visibleRatio = input.visibleRatio;
    result.visibleMs = Math.min(input.visibleMs, 60_000);
  }
  // Ignore userId, timestamps, points, reactions and watch claims.
  return result;
};

const signalDay = (nowMs) => {
  if (!Number.isFinite(nowMs)) throw new TypeError('Invalid signal timestamp');
  return new Date(nowMs).toISOString().slice(0, 10);
};

module.exports = { ACTION_TYPES, SURFACES, parseTrailerIdentity, validateSignalAction, signalDay };
