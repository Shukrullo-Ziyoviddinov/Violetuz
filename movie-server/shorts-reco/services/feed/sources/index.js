'use strict';

const sameMovie = require('./sameMovie.source');
const sameMusic = require('./sameMusic.source');
const sameArtist = require('./sameArtist.source');
const similar = require('./similar.source');
const actor = require('./actor.source');
const bridge = require('./bridge.source');
const profile = require('./profile.source');
const explore = require('./explore.source');

const collectors = {
  sameMovie: sameMovie.collect,
  sameMusic: sameMusic.collect,
  sameArtist: sameArtist.collect,
  similar: similar.collect,
  actor: actor.collect,
  bridge: bridge.collect,
  profile: profile.collect,
  explore: explore.collect,
};

/**
 * A source that throws or returns nothing becomes an empty list.
 * @param {{ source: string, step?: string }} step
 * @param {object} ctx
 * @returns {Promise<object[]>}
 */
const runStep = async (step, ctx) => {
  const collect = collectors[step.source];
  if (!collect) return [];
  try {
    const docs = await collect({ ...ctx, step: step.step });
    return Array.isArray(docs) ? docs : [];
  } catch (error) {
    if (ctx.logger && typeof ctx.logger.error === 'function') {
      ctx.logger.error('shorts-reco source failed', step.source);
    }
    return [];
  }
};

module.exports = {
  collectors,
  runStep,
};
