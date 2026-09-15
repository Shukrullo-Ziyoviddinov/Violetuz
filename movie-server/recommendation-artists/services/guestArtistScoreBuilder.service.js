/**
 * Build recommended-artist scores from guest localHistory — DB write YO‘Q.
 * Login parity: distinct contentKey → +1 per catalog artistId (entityDistinctCount),
 * then minScore filter. Catalog artistId only (never client-forged).
 *
 * @module recommendation-artists/services/guestArtistScoreBuilder.service
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { toEntityIdList } = require('../../recommendation-shared/entityDistinctCount');
const { toContentKey } = require('../../recommendation-music/utils/contentKey');
const {
  sanitizeLocalHistory,
  guestHistoryConfig,
} = require('./guestLocalHistory.sanitize');

/**
 * @param {Map<string, Object>|Object} contentsByKey
 * @param {string} contentKey
 * @returns {Object|null}
 */
const resolveContent = (contentsByKey, contentKey) => {
  if (!contentsByKey || !contentKey) return null;
  if (typeof contentsByKey.get === 'function') {
    return contentsByKey.get(contentKey) || null;
  }
  return contentsByKey[contentKey] || null;
};

/**
 * Fold sanitized listen events into artist scores (memory only).
 *
 * @param {Array<{m:string,ct:string,r:number,t:number}>} events
 * @param {Object} [params]
 * @param {Map<string, Object>|Object} [params.contentsByKey]
 * @param {number} [params.minScore]
 * @param {number} [params.limit]
 */
const buildArtistScoresFromEvents = (
  events,
  {
    contentsByKey = new Map(),
    minScore: minScoreOpt,
    limit: limitOpt,
  } = {}
) => {
  const configuredMin = scoringWeights.minContentCount ?? 2;
  const requestedMin = Number(minScoreOpt);
  const minScore = Math.max(
    configuredMin,
    Number.isFinite(requestedMin) && requestedMin > 0 ? requestedMin : configuredMin
  );

  const defaultLimit = scoringWeights.defaultLimit ?? 40;
  const maxLimit = scoringWeights.maxLimit ?? 80;
  let limit = Number(limitOpt);
  if (!Number.isFinite(limit) || limit <= 0) limit = defaultLimit;
  limit = Math.min(maxLimit, Math.floor(limit));

  /** @type {Map<string, number>} */
  const scoreByArtist = new Map();
  /** @type {Set<string>} */
  const creditedKeys = new Set();
  let skippedUnknownContents = 0;

  if (!Array.isArray(events) || !events.length) {
    return {
      artists: [],
      minScore,
      limit,
      creditedContentCount: 0,
      skippedUnknownContents: 0,
      source: 'empty',
    };
  }

  for (const event of events) {
    const contentKey = toContentKey(event.ct, event.m);
    if (!contentKey || creditedKeys.has(contentKey)) continue;

    const content = resolveContent(contentsByKey, contentKey);
    if (!content) {
      skippedUnknownContents += 1;
      continue;
    }

    // Login progress credits content.artistId (singular); accept artists[] fallback
    const artistIds = toEntityIdList(content.artistId ?? content.artists);
    // Distinct content claim once (login tryClaimItem parity)
    creditedKeys.add(contentKey);
    if (!artistIds.length) continue;

    for (const artistId of artistIds) {
      scoreByArtist.set(artistId, (scoreByArtist.get(artistId) || 0) + 1);
    }
  }

  const artists = [...scoreByArtist.entries()]
    .filter(([, score]) => score >= minScore)
    .map(([artistId, score]) => ({ artistId, score }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.artistId).localeCompare(String(b.artistId));
    })
    .slice(0, limit);

  return {
    artists,
    minScore,
    limit,
    creditedContentCount: creditedKeys.size,
    skippedUnknownContents,
    source: artists.length ? 'guest_artist_watch_score' : 'empty',
  };
};

/**
 * Sanitize + build. Caller supplies contentsByKey (catalog hydrate in serve step).
 *
 * @param {unknown} localHistory
 * @param {Object} [options]
 */
const buildFromLocalHistory = (localHistory, options = {}) => {
  const sanitized = sanitizeLocalHistory(localHistory, {
    nowMs: options.nowMs,
    config: options.config || guestHistoryConfig,
  });
  if (!sanitized.ok) {
    return sanitized;
  }

  const built = buildArtistScoresFromEvents(sanitized.events, {
    contentsByKey: options.contentsByKey || new Map(),
    minScore: options.minScore,
    limit: options.limit,
  });

  return {
    ok: true,
    events: sanitized.events,
    ...built,
  };
};

module.exports = {
  sanitizeLocalHistory,
  buildArtistScoresFromEvents,
  buildFromLocalHistory,
  guestHistoryConfig,
};
