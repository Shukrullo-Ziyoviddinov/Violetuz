/**
 * Kino qidiruv facetlari: filterCountry, filterGenre va year.
 * Umumiy engine → searchFacetEngine.js
 * Year → searchYearFacets.js
 * Musiqa → searchMusicFacets.js
 * Klip → searchClipFacets.js
 * Konsert → searchConcertFacets.js
 * Albom → searchAlbumFacets.js
 */

const {
  normalizeText,
  parseCountryGenreFacets,
  matchSingleField,
  matchMultiField,
  countryGenreFacetScore,
} = require('./searchFacetEngine');
const { parseYearFacet, stripYearTokens } = require('./searchYearFacets');

const NOISE_WORDS = [
  'kino',
  'kinolar',
  'kinolari',
  'filmi',
  'film',
  'filmlar',
  'filmlari',
  'serial',
  'seriallar',
  'seriallari',
  'movie',
  'movies',
  'tarjima',
  'tarjimada',
  'tilida',
  'toplam',
  'toplami',
  'toplamlar',
  'toplamlari',
  'collection',
  'collections',
];

/** DB filterCountry qiymatlari + foydalanuvchi sinonimlari */
const COUNTRY_FACETS = [
  { values: ['USA'], aliases: ['usa', 'amerika', 'america', 'aqsh', 'united states', 'shtat'] },
  { values: ['Korea'], aliases: ['korea', 'koreya', 'korean', 'koreys', 'koreyscha', 'karischa', 'karea'] },
  { values: ['Xitoy', 'China'], aliases: ['xitoy', 'china', 'xita', 'xtoy', 'chinese', 'xitoycha'] },
  { values: ['Japan'], aliases: ['japan', 'yaponiya', 'yapon', 'anime yapon'] },
  { values: ['India'], aliases: ['india', 'hind', 'hindiston', 'hindcha'] },
  { values: ['Russia'], aliases: ['russia', 'rossiya', 'rassiya', 'rassia', 'rus', 'ruscha'] },
  { values: ['UK'], aliases: ['uk', 'britaniya', 'ingliz', 'angliya'] },
  { values: ['Turkey'], aliases: ['turkey', 'turkiya', 'turk', 'turukcha'] },
  { values: ['Germaniya'], aliases: ['germaniya', 'german', 'germany'] },
  { values: ['Fransiya'], aliases: ['fransiya', 'france', 'fransuz', 'fransuzcha'] },
  { values: ['Italiya'], aliases: ['italiya', 'italy', 'italyan'] },
  { values: ['Tailand'], aliases: ['tailand', 'thailand', 'tayland', 'tailandcha', 'taylandcha'] },
  {
    values: ['Uzbekiston', 'Uzbekistan'],
    aliases: [
      'uzbekiston',
      'uzbek',
      'ozbek',
      'o zbek',
      "o'zbek",
      'ozbekcha',
      "o'zbekcha",
      'uzbekcha',
      'ozb',
      'uzb',
    ],
  },
  {
    values: ["Qozog'iston"],
    aliases: ['qozogiston', "qozog'iston", 'qozoq', 'qozoqcha', 'kazakhstan'],
  },
];

/** DB filterGenre qiymatlari + foydalanuvchi sinonimlari */
const GENRE_FACETS = [
  { values: ['Jangari'], aliases: ['jangari', 'jangari kino', 'jangaricha kino', 'action', 'aksion'] },
  {
    values: ['Boevik', 'Jangari'],
    aliases: [
      'boevik',
      'boevik kino',
      'olish kino',
      'otishma',
      'oteshema',
      'urush kino',
      'jaxon urushi',
      'jahon urushi',
    ],
  },
  { values: ['Triller'], aliases: ['triller', 'thriller'] },
  { values: ['Sarguzasht'], aliases: ['sarguzasht', 'sargizasht', 'adventure'] },
  {
    values: ["Qo'rqinchli"],
    aliases: [
      'qorqinchli',
      'qorqinch',
      'horror',
      'daxshat',
      'dahshat',
      'daxshatli',
      'daxshatli kino',
    ],
  },
  { values: ['Komediya'], aliases: ['komediya', 'comedy', 'komedik'] },
  { values: ['Drama'], aliases: ['drama'] },
  { values: ['Romantik', 'Romantika'], aliases: ['romantik', 'romantika', 'romance', 'sevgi'] },
  { values: ['Fantastika'], aliases: ['fantastika', 'fantasy', 'fantastik'] },
  {
    values: ['Multfilim', 'Animatsiya'],
    aliases: ['multfilim', 'multfilm', 'multik', 'animatsiya', 'cartoon'],
  },
  { values: ['Anime'], aliases: ['anime'] },
  { values: ['Kriminal'], aliases: ['kriminal', 'crime', 'detektiv kriminal'] },
  { values: ['Detektiv'], aliases: ['detektiv', 'detective'] },
  { values: ['Oilaviy'], aliases: ['oilaviy', 'family'] },
  { values: ['Biografiya'], aliases: ['biografiya', 'biography'] },
  { values: ['Tarixiy'], aliases: ['tarixiy', 'historical', 'history'] },
  { values: ['Sport'], aliases: ['sport', 'sportiv'] },
  { values: ['Vestern'], aliases: ['vestern', 'western'] },
];

/**
 * Country + genre + year.
 * Year avval parse → tokenlar olib tashlanadi → country/genre/title toza qoladi.
 */
const parseMovieSearchFacets = (rawQuery) => {
  const yearFacet = parseYearFacet(rawQuery);
  const queryWithoutYear = stripYearTokens(rawQuery, yearFacet);
  const base = parseCountryGenreFacets(
    queryWithoutYear,
    COUNTRY_FACETS,
    GENRE_FACETS,
    NOISE_WORDS
  );

  return {
    ...base,
    yearMode: yearFacet.mode,
    year: yearFacet.year,
    isYearSearch: yearFacet.isYearSearch,
    isFacetSearch: base.isFacetSearch || yearFacet.isYearSearch,
  };
};

const matchFilterCountry = (filterCountry, countryTargets, queryWords = []) =>
  matchSingleField(filterCountry, countryTargets, queryWords, COUNTRY_FACETS);

const matchFilterGenre = (filterGenre, genreTargets, queryWords = []) =>
  matchMultiField(filterGenre, genreTargets, queryWords, GENRE_FACETS);

const movieFacetMatchScore = (movie, facets, queryWords) =>
  countryGenreFacetScore(
    { countryValue: movie.filterCountry, genreValue: movie.filterGenre },
    facets,
    queryWords,
    COUNTRY_FACETS,
    GENRE_FACETS
  );

module.exports = {
  parseMovieSearchFacets,
  movieFacetMatchScore,
  matchFilterCountry,
  matchFilterGenre,
  normalizeText,
  COUNTRY_FACETS,
  GENRE_FACETS,
};
