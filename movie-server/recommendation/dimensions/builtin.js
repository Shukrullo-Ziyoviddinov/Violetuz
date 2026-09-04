/**
 * Built-in AffinityDimension definitions.
 * Field sources: filterGenre, filterCountry, actors (via scoringWeights.movieFields).
 *
 * @module recommendation/dimensions/builtin
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { toStringList } = require('../utils/values');
const { cartesianComboKeys } = require('../utils/comboKeys');
const { createDimension } = require('./createDimension');

const fields = scoringWeights.movieFields;
const types = scoringWeights.dimensionTypes;

/** @type {import('../types/recommendation.types').AffinityDimension} */
const genreDimension = createDimension({
  type: types.genre,
  weightKey: 'genre',
  extractValues: (movie) => toStringList(movie[fields.genres]),
});

/** @type {import('../types/recommendation.types').AffinityDimension} */
const countryDimension = createDimension({
  type: types.country,
  weightKey: 'country',
  extractValues: (movie) => toStringList(movie[fields.country]),
});

/** @type {import('../types/recommendation.types').AffinityDimension} */
const actorDimension = createDimension({
  type: types.actor,
  weightKey: 'actor',
  extractValues: (movie) => toStringList(movie[fields.actors]),
});

/** @type {import('../types/recommendation.types').AffinityDimension} */
const genreCountryDimension = createDimension({
  type: types.genreCountry,
  weightKey: 'comboGenreCountry',
  isCombo: true,
  extractValues: (movie) =>
    cartesianComboKeys(movie[fields.country], movie[fields.genres], scoringWeights.comboSeparator),
});

/** @type {import('../types/recommendation.types').AffinityDimension} */
const genreActorDimension = createDimension({
  type: types.genreActor,
  weightKey: 'comboGenreActor',
  isCombo: true,
  extractValues: (movie) =>
    cartesianComboKeys(movie[fields.genres], movie[fields.actors], scoringWeights.comboSeparator),
});

/**
 * Default registry order: singles first, then combos.
 * Scoring / affinity jobs iterate this array — no per-type if/else.
 * @type {import('../types/recommendation.types').AffinityDimension[]}
 */
const builtinDimensions = Object.freeze([
  genreDimension,
  countryDimension,
  actorDimension,
  genreCountryDimension,
  genreActorDimension,
]);

module.exports = {
  genreDimension,
  countryDimension,
  actorDimension,
  genreCountryDimension,
  genreActorDimension,
  builtinDimensions,
};
