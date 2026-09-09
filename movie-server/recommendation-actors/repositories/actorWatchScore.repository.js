'use strict';

const { store } = require('../store');

module.exports = {
  tryClaimMovieCredit: (userId, movieId, actorIds) =>
    store.tryClaimItem(userId, movieId, actorIds),
  incrementActorScores: (userId, actorIds) =>
    store.incrementEntityScores(userId, actorIds),
  listTopActorsByScore: async (userId, opts = {}) => {
    const rows = await store.listTopEntities(userId, opts);
    return rows.map((row) => ({
      actorId: row.entityId,
      score: row.score,
    }));
  },
};
