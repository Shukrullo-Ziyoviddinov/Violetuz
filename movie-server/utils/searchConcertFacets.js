/**
 * Konsert qidiruv facetlari: genre, country va year.
 * Year → searchYearFacets.js (umumiy)
 */

const {
  parseCountryGenreFacets,
  matchSingleField,
  countryGenreFacetScore,
} = require('./searchFacetEngine');
const { attachYearFacet, COLLECTION_NOISE_WORDS } = require('./searchYearFacets');
const { MEDIA_COUNTRY_FACETS, MEDIA_GENRE_FACETS } = require('./searchMediaFacetData');
const { ARTIST_MEDIA_NOISE_WORDS } = require('./searchArtistMediaFacets');
const { MEDIA_CROSS_TYPE_NOISE_WORDS } = require('./searchContentType');

const CONCERT_COUNTRY_FACETS = MEDIA_COUNTRY_FACETS;
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
  ...COLLECTION_NOISE_WORDS,
  ...ARTIST_MEDIA_NOISE_WORDS,
  ...MEDIA_CROSS_TYPE_NOISE_WORDS,
];

const parseConcertSearchFacets = (rawQuery) =>
  attachYearFacet(rawQuery, (cleaned) =>
    parseCountryGenreFacets(cleaned, CONCERT_COUNTRY_FACETS, CONCERT_GENRE_FACETS, NOISE_WORDS)
  );

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
