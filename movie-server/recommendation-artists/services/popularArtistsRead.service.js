/**
 * Mashhur artistlar — faqat artist credit o‘qish.
 * Aggregation weekly/top bilan bir xil (`getTopArtists` → getTrendingArtists).
 * Bu fayl faqat 30 kunlik oyna va limit knoblarini beradi (bir marta clamp).
 * Credit yozuvi / progress ga tegilmaydi.
 *
 * @module recommendation-artists/services/popularArtistsRead.service
 */

'use strict';

const { popularArtistsConfig } = require('../config/popularArtists.config');
const { getTopArtists } = require('./topArtists.service');

/**
 * @param {{ now?: Date, limit?: number }} [opts]
 * `now` reserved (trending uses Date.now()); limit popular config bilan clamp.
 */
const getPopularArtists = async (opts = {}) => {
  const windowDays = popularArtistsConfig.windowDays;

  const result = await getTopArtists({
    limit: opts.limit,
    windowDays,
    defaultLimit: popularArtistsConfig.topLimit,
    maxLimit: popularArtistsConfig.topMaxLimit,
  });

  return {
    artists: result.artists || [],
    limit: result.limit,
    windowDays,
    source: result.artists?.length ? 'popular_artists' : 'empty',
  };
};

module.exports = {
  getPopularArtists,
};
