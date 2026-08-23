/**
 * Konsert qidiruv facetlari: genre va country.
 * Umumiy engine → searchFacetEngine.js
 * Umumiy values/aliases → searchMediaFacetData.js
 */

const {
  parseCountryGenreFacets,
  matchSingleField,
  countryGenreFacetScore,
} = require('./searchFacetEngine');

const { MEDIA_COUNTRY_FACETS, MEDIA_GENRE_FACETS } = require('./searchMediaFacetData');

/** DB konsert.country — klip/musiqa bilan bir xil qiymatlar */
const CONCERT_COUNTRY_FACETS = MEDIA_COUNTRY_FACETS;

/** DB konsert.genre — klip/musiqa bilan bir xil qiymatlar */
const CONCERT_GENRE_FACETS = MEDIA_GENRE_FACETS;

const NOISE_WORDS = [
  'konsert',
  'konserts',
  'konsertlar',
  'konsertlari',
  'concert',
  'concerts',
  'live',
  'live show',
  'liveshow',
  'jonli',
  'jonli konsert',
  'video konsert',
  'video konsertlar',
  'musiqa',
  'musiqalar',
  'music',
  'show',
  'performance',
];

const parseConcertSearchFacets = (rawQuery) =>
  parseCountryGenreFacets(rawQuery, CONCERT_COUNTRY_FACETS, CONCERT_GENRE_FACETS, NOISE_WORDS);

const matchConcertCountry = (country, countryTargets, queryWords = []) =>
  matchSingleField(country, countryTargets, queryWords, CONCERT_COUNTRY_FACETS);

const matchConcertGenre = (genre, genreTargets, queryWords = []) =>
  matchSingleField(genre, genreTargets, queryWords, CONCERT_GENRE_FACETS);

const concertFacetMatchScore = (item, facets, queryWords) =>
  countryGenreFacetScore(
    { countryValue: item.country, genreValue: item.genre },
    facets,
    queryWords,
    CONCERT_COUNTRY_FACETS,
    CONCERT_GENRE_FACETS
  );

module.exports = {
  parseConcertSearchFacets,
  concertFacetMatchScore,
  matchConcertCountry,
  matchConcertGenre,
  CONCERT_COUNTRY_FACETS,
  CONCERT_GENRE_FACETS,
};
