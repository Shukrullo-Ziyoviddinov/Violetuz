'use strict';

const collections = require('../config/collections');
const { parseShortCatalogId } = require('../utils/keys');

const movieType = collections.existing.shortsVideos.type;
const movieCollection = collections.existing.shortsVideos.name;
const musicCollection = collections.existing.musicShorts.name;

/**
 * @param {import('mongodb').Collection} collection
 * @param {number[]} ids
 * @param {{ error: Function }|Console} logger
 */
const loadByIds = async (collection, ids, logger) => {
  const found = new Map();
  if (!ids.length) return found;
  try {
    const docs = await collection.find({ id: { $in: ids } }).toArray();
    for (let i = 0; i < docs.length; i += 1) {
      const doc = docs[i];
      if (!doc || doc.id == null) continue;
      const { _id, ...rest } = doc;
      found.set(Number(doc.id), rest);
    }
  } catch (error) {
    logger.error(
      'shorts-reco hydrate failed',
      error && error.message ? error.message : error
    );
  }
  return found;
};

/**
 * Attaches the stored short so the client can play it.
 * Scoring never reads these documents.
 * @param {import('mongoose').Connection|import('mongodb').Db} connection
 * @param {{ error: Function }|Console} [logger]
 */
const createHydrator = (connection, logger = console) => {
  /**
   * @param {object[]} items
   */
  return async (items) => {
    const list = items || [];
    const movieIds = [];
    const musicIds = [];
    for (let i = 0; i < list.length; i += 1) {
      const parsed = parseShortCatalogId(list[i] && list[i].shortId);
      if (!parsed) continue;
      if (parsed.type === movieType) movieIds.push(parsed.numericId);
      else musicIds.push(parsed.numericId);
    }
    const movies = await loadByIds(connection.collection(movieCollection), movieIds, logger);
    const music = await loadByIds(connection.collection(musicCollection), musicIds, logger);
    return list.map((item) => {
      const parsed = parseShortCatalogId(item && item.shortId);
      if (!parsed) return { ...item, short: null };
      const source = parsed.type === movieType ? movies : music;
      return { ...item, short: source.get(parsed.numericId) || null };
    });
  };
};

module.exports = {
  createHydrator,
};
