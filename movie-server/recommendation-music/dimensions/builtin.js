/**
 * Built-in music AffinityDimension definitions.
 * Fields: genre / country / language / artistId (+ combos).
 *
 * @module recommendation-music/dimensions/builtin
 */

'use strict';

const { scoringWeights } = require('../config/scoringWeights');
const { toStringList } = require('../../recommendation/utils/values');
const { cartesianComboKeys } = require('../../recommendation/utils/comboKeys');
const { createDimension } = require('./createDimension');

const fields = scoringWeights.contentFields;
const types = scoringWeights.dimensionTypes;
const sep = scoringWeights.comboSeparator;

/** @type {import('../types/musicRecommendation.types').AffinityDimension} */
const genreDimension = createDimension({
  type: types.genre,
  weightKey: 'genre',
  extractValues: (content) => toStringList(content[fields.genre]),
});

/** @type {import('../types/musicRecommendation.types').AffinityDimension} */
const countryDimension = createDimension({
  type: types.country,
  weightKey: 'country',
  extractValues: (content) => toStringList(content[fields.country]),
});

/** @type {import('../types/musicRecommendation.types').AffinityDimension} */
const languageDimension = createDimension({
  type: types.language,
  weightKey: 'language',
  extractValues: (content) => toStringList(content[fields.language]),
});

/** @type {import('../types/musicRecommendation.types').AffinityDimension} */
const artistDimension = createDimension({
  type: types.artist,
  weightKey: 'artist',
  extractValues: (content) => toStringList(content[fields.artistId]),
});

/** @type {import('../types/musicRecommendation.types').AffinityDimension} */
const genreCountryDimension = createDimension({
  type: types.genreCountry,
  weightKey: 'comboGenreCountry',
  isCombo: true,
  extractValues: (content) =>
    cartesianComboKeys(content[fields.country], content[fields.genre], sep),
});

/** @type {import('../types/musicRecommendation.types').AffinityDimension} */
const genreArtistDimension = createDimension({
  type: types.genreArtist,
  weightKey: 'comboGenreArtist',
  isCombo: true,
  extractValues: (content) =>
    cartesianComboKeys(content[fields.genre], content[fields.artistId], sep),
});

/** @type {import('../types/musicRecommendation.types').AffinityDimension} */
const languageCountryDimension = createDimension({
  type: types.languageCountry,
  weightKey: 'comboLanguageCountry',
  isCombo: true,
  extractValues: (content) =>
    cartesianComboKeys(content[fields.language], content[fields.country], sep),
});

/** @type {import('../types/musicRecommendation.types').AffinityDimension[]} */
const builtinDimensions = Object.freeze([
  genreDimension,
  countryDimension,
  languageDimension,
  artistDimension,
  genreCountryDimension,
  genreArtistDimension,
  languageCountryDimension,
]);

module.exports = {
  genreDimension,
  countryDimension,
  languageDimension,
  artistDimension,
  genreCountryDimension,
  genreArtistDimension,
  languageCountryDimension,
  builtinDimensions,
};
