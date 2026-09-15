/**
 * Guest recommended artists — same distinct-contentKey score as login,
 * from localHistory (stateless). NEVER writes artist credit/score collections.
 *
 * @module recommendation-artists/services/guestRecommendedArtists.service
 */

'use strict';

const {
  findContentProjection,
} = require('../../recommendation-music/repositories/contentProjection.repository');
const { toContentKey } = require('../../recommendation-music/utils/contentKey');
const { buildFromLocalHistory } = require('./guestArtistScoreBuilder.service');
const { badRequest } = require('../../utils/errors');

/**
 * POST /api/recommended-artists/guest
 *
 * @param {Object} params
 * @param {unknown} params.localHistory — FE violet_guest_music_v1 rows
 * @param {number} [params.limit]
 * @param {number} [params.minScore]
 */
const getGuestRecommendedArtists = async (params = {}) => {
  const nowMs = Date.now();

  const preview = buildFromLocalHistory(params.localHistory, {
    contentsByKey: new Map(),
    nowMs,
    limit: params.limit,
    minScore: params.minScore,
  });
  if (!preview.ok) {
    throw badRequest(preview.error);
  }

  const uniquePairs = [];
  const seen = new Set();
  for (const e of preview.events) {
    const key = toContentKey(e.ct, e.m);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    uniquePairs.push({ contentType: e.ct, contentId: e.m, contentKey: key });
  }

  const projections = await Promise.all(
    uniquePairs.map((p) => findContentProjection(p.contentType, p.contentId))
  );
  const contentsByKey = new Map();
  for (let i = 0; i < uniquePairs.length; i += 1) {
    const doc = projections[i];
    if (doc) contentsByKey.set(uniquePairs[i].contentKey, doc);
  }

  const built = buildFromLocalHistory(params.localHistory, {
    contentsByKey,
    nowMs,
    limit: params.limit,
    minScore: params.minScore,
  });
  if (!built.ok) {
    throw badRequest(built.error);
  }

  return {
    userId: null,
    artists: built.artists,
    minScore: built.minScore,
    limit: built.limit,
    source: built.source.startsWith('guest_')
      ? built.source
      : built.artists.length
        ? 'guest_artist_watch_score'
        : 'guest_empty',
    creditedContentCount: built.creditedContentCount,
  };
};

module.exports = {
  getGuestRecommendedArtists,
};
