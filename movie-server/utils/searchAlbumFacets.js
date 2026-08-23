/**
 * Musiqa albom qidiruv facetlari: genre va country.
 * Umumiy engine → searchFacetEngine.js
 * Umumiy values/aliases → searchMediaFacetData.js
 */

const {
  parseCountryGenreFacets,
  matchSingleField,
  countryGenreFacetScore,
} = require('./searchFacetEngine');

const { MEDIA_COUNTRY_FACETS, MEDIA_GENRE_FACETS } = require('./searchMediaFacetData');

/** DB album.country — musiqa bilan bir xil qiymatlar */
const ALBUM_COUNTRY_FACETS = MEDIA_COUNTRY_FACETS;

/** DB album.genre — musiqa bilan bir xil qiymatlar */
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
  'collection',
  'toplama',
];

const parseAlbumSearchFacets = (rawQuery) =>
  parseCountryGenreFacets(rawQuery, ALBUM_COUNTRY_FACETS, ALBUM_GENRE_FACETS, NOISE_WORDS);

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
