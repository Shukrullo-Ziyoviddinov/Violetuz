/**
 * Musiqa qidiruv facetlari: genre, country va year.
 * Umumiy engine → searchFacetEngine.js
 * Year → searchYearFacets.js (kino bilan bir xil)
 * Umumiy values/aliases → searchMediaFacetData.js
 */

const {
  normalizeText,
  parseCountryGenreFacets,
  matchSingleField,
  countryGenreFacetScore,
} = require('./searchFacetEngine');
const { attachYearFacet, COLLECTION_NOISE_WORDS } = require('./searchYearFacets');
const { MEDIA_COUNTRY_FACETS, MEDIA_GENRE_FACETS } = require('./searchMediaFacetData');
const { ARTIST_MEDIA_NOISE_WORDS } = require('./searchArtistMediaFacets');
const { MEDIA_CROSS_TYPE_NOISE_WORDS } = require('./searchContentType');

const NOISE_WORDS = [
  'musiqa',
  'musiqalar',
  'musiqasi',
  'musiqalari',
  'music',
  'musics',
  'song',
  'songs',
  'qoshiq',
  'qoshiqlar',
  'qoshiqlari',
  'trek',
  'treklar',
  'track',
  'tracks',
  'audio',
  ...COLLECTION_NOISE_WORDS,
  ...ARTIST_MEDIA_NOISE_WORDS,
  ...MEDIA_CROSS_TYPE_NOISE_WORDS,
];

const MUSIC_COUNTRY_FACETS = MEDIA_COUNTRY_FACETS;
const MUSIC_GENRE_FACETS = MEDIA_GENRE_FACETS;

const parseMusicSearchFacets = (rawQuery) =>
  attachYearFacet(rawQuery, (cleaned) =>
    parseCountryGenreFacets(cleaned, MUSIC_COUNTRY_FACETS, MUSIC_GENRE_FACETS, NOISE_WORDS)
  );

const matchMusicCountry = (country, countryTargets, queryWords = []) =>
  matchSingleField(country, countryTargets, queryWords, MUSIC_COUNTRY_FACETS);

const matchMusicGenre = (genre, genreTargets, queryWords = []) =>
  matchSingleField(genre, genreTargets, queryWords, MUSIC_GENRE_FACETS);

const musicFacetMatchScore = (item, facets, queryWords) =>
  countryGenreFacetScore(
    { countryValue: item.country, genreValue: item.genre },
    facets,
    queryWords,
    MUSIC_COUNTRY_FACETS,
    MUSIC_GENRE_FACETS
  );

module.exports = {
  parseMusicSearchFacets,
  musicFacetMatchScore,
  matchMusicCountry,
  matchMusicGenre,
  normalizeText,
  MUSIC_COUNTRY_FACETS,
  MUSIC_GENRE_FACETS,
};
