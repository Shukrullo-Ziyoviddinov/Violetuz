/**
 * Kanal kino id to'plami. Umumiy manba chaqiruvi bu to'plamsiz o'z holida qoladi.
 *
 * @module home-feed/channel/allowIds
 */

'use strict';

const Movie = require('../../models/Movie.model');

/**
 * @param {unknown} allowed
 * @returns {Set<string>|null}
 */
const asAllowSet = (allowed) => (allowed instanceof Set ? allowed : null);

/**
 * @param {Set<string>|null} allowed
 * @returns {number[]}
 */
const numericMovieIds = (allowed) => {
  if (!allowed) return [];
  return [...allowed]
    .map((id) => Number(String(id).trim()))
    .filter((id) => Number.isInteger(id));
};

/**
 * @param {string} channelId
 * @returns {Promise<Set<string>>}
 */
const loadChannelMovieIdSet = async (channelId) => {
  const channel = String(channelId || '').trim();
  const ids = new Set();
  if (!channel) return ids;

  const rows = await Movie.find({ channelId: channel })
    .select({ _id: 0, id: 1 })
    .lean();

  for (const row of rows || []) {
    const id = String(row.id ?? '').trim();
    if (id) ids.add(id);
  }
  return ids;
};

module.exports = {
  asAllowSet,
  numericMovieIds,
  loadChannelMovieIdSet,
};
