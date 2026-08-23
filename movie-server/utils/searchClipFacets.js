/**
 * Klip qidiruv facetlari: genre va country.
 * Umumiy engine → searchFacetEngine.js
 * Umumiy values/aliases → searchMediaFacetData.js
 */

const {
  parseCountryGenreFacets,
  matchSingleField,
  countryGenreFacetScore,
} = require('./searchFacetEngine');

const { MEDIA_COUNTRY_FACETS, MEDIA_GENRE_FACETS } = require('./searchMediaFacetData');

/** DB clip.country — musiqa bilan bir xil qiymatlar */
const CLIP_COUNTRY_FACETS = MEDIA_COUNTRY_FACETS;

/** DB clip.genre — musiqa bilan bir xil qiymatlar */
const CLIP_GENRE_FACETS = MEDIA_GENRE_FACETS;

const NOISE_WORDS = [
  'klip',
  'kliplar',
  'kliplari',
  'klips',
  'clip',
  'clips',
  'video',
  'videos',
  'videoklip',
  'video klip',
  'video kliplar',
  'video clip',
  'video clips',
  'videokliplar',
  'musiqa',
  'musiqalar',
  'music',
  'mv',
  'music video',
];

const parseClipSearchFacets = (rawQuery) =>
  parseCountryGenreFacets(rawQuery, CLIP_COUNTRY_FACETS, CLIP_GENRE_FACETS, NOISE_WORDS);

const matchClipCountry = (country, countryTargets, queryWords = []) =>
  matchSingleField(country, countryTargets, queryWords, CLIP_COUNTRY_FACETS);

const matchClipGenre = (genre, genreTargets, queryWords = []) =>
  matchSingleField(genre, genreTargets, queryWords, CLIP_GENRE_FACETS);

const clipFacetMatchScore = (item, facets, queryWords) =>
  countryGenreFacetScore(
    { countryValue: item.country, genreValue: item.genre },
    facets,
    queryWords,
    CLIP_COUNTRY_FACETS,
    CLIP_GENRE_FACETS
  );

module.exports = {
  parseClipSearchFacets,
  clipFacetMatchScore,
  matchClipCountry,
  matchClipGenre,
  CLIP_COUNTRY_FACETS,
  CLIP_GENRE_FACETS,
};
