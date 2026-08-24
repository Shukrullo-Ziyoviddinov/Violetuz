/**
 * Klip qidiruv facetlari: genre, country va year.
 * Year → searchYearFacets.js (umumiy)
 */

const {
  parseCountryGenreFacets,
  matchSingleField,
  countryGenreFacetScore,
} = require('./searchFacetEngine');
const { attachYearFacet, COLLECTION_NOISE_WORDS } = require('./searchYearFacets');
const { MEDIA_COUNTRY_FACETS, MEDIA_GENRE_FACETS } = require('./searchMediaFacetData');

const CLIP_COUNTRY_FACETS = MEDIA_COUNTRY_FACETS;
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
  ...COLLECTION_NOISE_WORDS,
];

const parseClipSearchFacets = (rawQuery) =>
  attachYearFacet(rawQuery, (cleaned) =>
    parseCountryGenreFacets(cleaned, CLIP_COUNTRY_FACETS, CLIP_GENRE_FACETS, NOISE_WORDS)
  );

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
