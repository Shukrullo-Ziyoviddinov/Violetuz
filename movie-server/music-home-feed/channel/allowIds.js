/**
 * Kanal qo'shiq id to'plami. Umumiy manba chaqiruvi bu to'plamsiz o'z holida qoladi.
 * Faqat qo'shiq. Albom, klip va konsert kirmaydi.
 *
 * @module music-home-feed/channel/allowIds
 */

'use strict';

const Music = require('../../models/Music.model');
const { catalogTrackMatch } = require('../repositories/catalog.read');

/**
 * @param {string} channelId
 * @returns {Promise<Set<string>>}
 */
const loadChannelMusicIdSet = async (channelId) => {
  const channel = String(channelId || '').trim();
  const ids = new Set();
  if (!channel) return ids;

  const rows = await Music.find({ channelId: channel, ...catalogTrackMatch() })
    .select({ _id: 0, id: 1 })
    .lean();

  for (const row of rows || []) {
    const id = String(row.id ?? '').trim();
    if (id) ids.add(id);
  }
  return ids;
};

module.exports = {
  loadChannelMusicIdSet,
};
