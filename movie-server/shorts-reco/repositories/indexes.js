'use strict';

const config = require('../config');
const collections = require('../config/collections');
const { daysToSeconds } = require('../utils/time');

const catalogIndexSpecs = Object.freeze([
  Object.freeze({ key: { shortId: 1 }, options: Object.freeze({ unique: true, name: 'shortId_unique' }) }),
  Object.freeze({ key: { movieId: 1 }, options: Object.freeze({ name: 'movieId' }) }),
  Object.freeze({ key: { musicKey: 1 }, options: Object.freeze({ name: 'musicKey' }) }),
  Object.freeze({ key: { songGroupId: 1 }, options: Object.freeze({ name: 'songGroupId' }) }),
  Object.freeze({ key: { artistId: 1 }, options: Object.freeze({ name: 'artistId' }) }),
  Object.freeze({
    key: { type: 1, contentType: 1 },
    options: Object.freeze({ name: 'type_contentType' }),
  }),
  Object.freeze({ key: { movieGenres: 1 }, options: Object.freeze({ name: 'movieGenres' }) }),
  Object.freeze({ key: { movieCountries: 1 }, options: Object.freeze({ name: 'movieCountries' }) }),
  Object.freeze({ key: { musicGenres: 1 }, options: Object.freeze({ name: 'musicGenres' }) }),
  Object.freeze({ key: { musicCountries: 1 }, options: Object.freeze({ name: 'musicCountries' }) }),
  Object.freeze({ key: { actors: 1 }, options: Object.freeze({ name: 'actors' }) }),
  Object.freeze({ key: { franchiseMovieIds: 1 }, options: Object.freeze({ name: 'franchiseMovieIds' }) }),
  Object.freeze({
    key: { catalogAddedAt: -1 },
    options: Object.freeze({ name: 'catalogAddedAt_desc' }),
  }),
]);

const songLinkIndexSpecs = Object.freeze([
  Object.freeze({
    key: { songGroupId: 1 },
    options: Object.freeze({ unique: true, name: 'songGroupId_unique' }),
  }),
  Object.freeze({
    key: { 'members.musicKey': 1 },
    options: Object.freeze({ name: 'members_musicKey' }),
  }),
]);

const watchStateIndexSpecs = Object.freeze([
  Object.freeze({
    key: { userId: 1, shortId: 1 },
    options: Object.freeze({ unique: true, name: 'userId_shortId_unique' }),
  }),
  Object.freeze({
    key: { userId: 1, lastSeenAt: -1 },
    options: Object.freeze({ name: 'userId_lastSeenAt' }),
  }),
  Object.freeze({
    key: { userId: 1, movieId: 1 },
    options: Object.freeze({ name: 'userId_movieId' }),
  }),
]);

const eventIndexSpecs = Object.freeze([
  Object.freeze({
    key: { eventId: 1 },
    options: Object.freeze({ unique: true, name: 'eventId_unique' }),
  }),
  Object.freeze({
    key: { createdAt: 1 },
    options: Object.freeze({
      name: 'createdAt_ttl',
      expireAfterSeconds: daysToSeconds(config.eventsTtlDays),
    }),
  }),
]);

const profileIndexSpecs = Object.freeze([
  Object.freeze({
    key: { userId: 1 },
    options: Object.freeze({ unique: true, name: 'userId_unique' }),
  }),
]);

const statsIndexSpecs = Object.freeze([
  Object.freeze({
    key: { shortId: 1 },
    options: Object.freeze({ unique: true, name: 'shortId_unique' }),
  }),
  Object.freeze({
    key: { views: -1, shortId: 1 },
    options: Object.freeze({ name: 'views_desc' }),
  }),
]);

const profileHeatIndexSpecs = Object.freeze([
  Object.freeze({
    key: { key: 1 },
    options: Object.freeze({ unique: true, name: 'profileKey_unique' }),
  }),
]);

const profileHeatUserIndexSpecs = Object.freeze([
  Object.freeze({
    key: { userId: 1, key: 1 },
    options: Object.freeze({ unique: true, name: 'userId_profileKey_unique' }),
  }),
]);

const feedSessionIndexSpecs = Object.freeze([
  Object.freeze({
    key: { sessionId: 1 },
    options: Object.freeze({ unique: true, name: 'sessionId_unique' }),
  }),
  Object.freeze({
    key: { userId: 1, updatedAt: -1 },
    options: Object.freeze({ name: 'userId_updatedAt' }),
  }),
  Object.freeze({
    key: { updatedAt: 1 },
    options: Object.freeze({
      name: 'updatedAt_ttl',
      expireAfterSeconds: daysToSeconds(config.feedSessionTtlDays),
    }),
  }),
]);

/**
 * @param {import('mongodb').Collection} collection
 * @param {Array<{ key: object, options: object }>} specs
 */
const applyIndexSpecs = async (collection, specs) => {
  for (let i = 0; i < specs.length; i += 1) {
    const spec = specs[i];
    await collection.createIndex({ ...spec.key }, { ...spec.options });
  }
};

/**
 * Indexes for the collections this phase writes.
 * Later reco_ collections add their specs here. Existing collections are never indexed.
 * @param {import('mongoose').Connection|import('mongodb').Db} connection
 */
const ensureRecoIndexes = async (connection) => {
  if (!connection || typeof connection.collection !== 'function') {
    throw new Error('shorts-reco requires the existing database connection');
  }

  await applyIndexSpecs(
    connection.collection(collections.reco.shortCatalog),
    catalogIndexSpecs
  );
  await applyIndexSpecs(
    connection.collection(collections.reco.songLinks),
    songLinkIndexSpecs
  );
  await applyIndexSpecs(
    connection.collection(collections.reco.watchState),
    watchStateIndexSpecs
  );
  await applyIndexSpecs(connection.collection(collections.reco.events), eventIndexSpecs);
  await applyIndexSpecs(
    connection.collection(collections.reco.userProfiles),
    profileIndexSpecs
  );
  await applyIndexSpecs(
    connection.collection(collections.reco.shortStats),
    statsIndexSpecs
  );
  await applyIndexSpecs(
    connection.collection(collections.reco.feedSessions),
    feedSessionIndexSpecs
  );
  await applyIndexSpecs(
    connection.collection(collections.reco.profileHeat),
    profileHeatIndexSpecs
  );
  await applyIndexSpecs(
    connection.collection(collections.reco.profileHeatUsers),
    profileHeatUserIndexSpecs
  );
};

module.exports = {
  catalogIndexSpecs,
  songLinkIndexSpecs,
  watchStateIndexSpecs,
  eventIndexSpecs,
  profileIndexSpecs,
  statsIndexSpecs,
  feedSessionIndexSpecs,
  profileHeatIndexSpecs,
  profileHeatUserIndexSpecs,
  ensureRecoIndexes,
};
