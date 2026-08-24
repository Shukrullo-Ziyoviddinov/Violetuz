/**
 * Musiqa albom qidiruv facetlari: genre, country va year.
 * Year → searchYearFacets.js (umumiy)
 */

const {
  parseCountryGenreFacets,
  matchSingleField,
  countryGenreFacetScore,
} = require('./searchFacetEngine');
const { attachYearFacet, COLLECTION_NOISE_WORDS } = require('./searchYearFacets');
const { MEDIA_COUNTRY_FACETS, MEDIA_GENRE_FACETS } = require('./searchMediaFacetData');

const ALBUM_COUNTRY_FACETS = MEDIA_COUNTRY_FACETS;
const ALBUM_GENRE_FACETS = MEDIA_GENRE_FACETS;

const NOISE_WORDS = [
  'albom',
  'albomlar',
  'albomlari',
  'album',
  'albums',
  'albumlar',
  'albomi',
  'musiqa albom',
  'musiqa albomlar',
  'musiqiy albom',
  'musiqiy albomlar',
  'musiqiy albumlar',
  'music album',
  'music albums',
  'music albom',
  'music albomlar',
  'musiqa',
  'musiqalar',
  'music',
  ...COLLECTION_NOISE_WORDS,
];

const parseAlbumSearchFacets = (rawQuery) =>
  attachYearFacet(rawQuery, (cleaned) =>
    parseCountryGenreFacets(cleaned, ALBUM_COUNTRY_FACETS, ALBUM_GENRE_FACETS, NOISE_WORDS)
  );

const matchAlbumCountry = (country, countryTargets, queryWords = []) =>
  matchSingleField(country, countryTargets, queryWords, ALBUM_COUNTRY_FACETS);

const matchAlbumGenre = (genre, genreTargets, queryWords = []) =>
  matchSingleField(genre, genreTargets, queryWords, ALBUM_GENRE_FACETS);

const albumFacetMatchScore = (item, facets, queryWords) =>
  countryGenreFacetScore(
    { countryValue: item.country, genreValue: item.genre },
    facets,
    queryWords,
    ALBUM_COUNTRY_FACETS,
    ALBUM_GENRE_FACETS
  );

module.exports = {
  parseAlbumSearchFacets,
  albumFacetMatchScore,
  matchAlbumCountry,
  matchAlbumGenre,
  ALBUM_COUNTRY_FACETS,
  ALBUM_GENRE_FACETS,
};
