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
const { attachYearFacet, COLLECTION_NOISE_WORDS } = require('./searchYearFacets');
const { ACTOR_FILM_NOISE_WORDS } = require('./searchActorFilmFacets');

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
  // RU
  'кино',
  'фильмы',
  'фильм',
  'фильмов',
  'фильма',
  'сериалы',
  'сериал',
  'сериалов',
  'сериала',
  'перевод',
  'переводе',
  'на языке',
  ...COLLECTION_NOISE_WORDS,
  ...ACTOR_FILM_NOISE_WORDS,
];

/** DB filterCountry qiymatlari + foydalanuvchi sinonimlari */
const COUNTRY_FACETS = [
  {
    values: ['USA'],
    aliases: [
      'usa',
      'amerika',
      'america',
      'aqsh',
      'united states',
      'shtat',
      // RU
      'америка',
      'американский',
      'американские',
      'сша',
    ],
  },
  {
    values: ['Korea'],
    aliases: [
      'korea',
      'koreya',
      'korean',
      'koreys',
      'koreyscha',
      'karischa',
      'karea',
      // RU
      'корея',
      'корейский',
      'корейские',
      'корейское',
    ],
  },
  {
    values: ['Xitoy', 'China'],
    aliases: [
      'xitoy',
      'china',
      'xita',
      'xtoy',
      'chinese',
      'xitoycha',
      // RU
      'китай',
      'китайский',
      'китайские',
      'китайское',
    ],
  },
  {
    values: ['Japan'],
    aliases: [
      'japan',
      'yaponiya',
      'yapon',
      'anime yapon',
      // RU
      'япония',
      'японский',
      'японские',
      'японское',
    ],
  },
  {
    values: ['India'],
    aliases: [
      'india',
      'hind',
      'hindiston',
      'hindcha',
      // RU
      'индия',
      'индийский',
      'индийские',
      'индийское',
    ],
  },
  {
    values: ['Russia'],
    aliases: [
      'russia',
      'rossiya',
      'rassiya',
      'rassia',
      'rus',
      'ruscha',
      // RU
      'россия',
      'русский',
      'русские',
      'русское',
      'российский',
      'российские',
    ],
  },
  {
    values: ['UK'],
    aliases: [
      'uk',
      'britaniya',
      'ingliz',
      'angliya',
      // RU
      'британия',
      'англия',
      'английский',
      'английские',
      'британский',
      'британские',
    ],
  },
  {
    values: ['Turkey'],
    aliases: [
      'turkey',
      'turkiya',
      'turk',
      'turukcha',
      // RU
      'турция',
      'турецкий',
      'турецкие',
      'турецкое',
    ],
  },
  {
    values: ['Germaniya'],
    aliases: [
      'germaniya',
      'german',
      'germany',
      // RU
      'германия',
      'немецкий',
      'немецкие',
      'немецкое',
    ],
  },
  {
    values: ['Fransiya'],
    aliases: [
      'fransiya',
      'france',
      'fransuz',
      'fransuzcha',
      // RU
      'франция',
      'французский',
      'французские',
      'французское',
    ],
  },
  {
    values: ['Italiya'],
    aliases: [
      'italiya',
      'italy',
      'italyan',
      // RU
      'италия',
      'итальянский',
      'итальянские',
      'итальянское',
    ],
  },
  {
    values: ['Tailand'],
    aliases: [
      'tailand',
      'thailand',
      'tayland',
      'tailandcha',
      'taylandcha',
      // RU
      'таиланд',
      'тайский',
      'тайские',
      'тайское',
    ],
  },
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
      // RU
      'узбекистан',
      'узбекский',
      'узбекские',
      'узбекское',
    ],
  },
  {
    values: ["Qozog'iston"],
    aliases: [
      'qozogiston',
      "qozog'iston",
      'qozoq',
      'qozoqcha',
      'kazakhstan',
      // RU
      'казахстан',
      'казахский',
      'казахские',
      'казахское',
    ],
  },
];

/** DB filterGenre qiymatlari + foydalanuvchi sinonimlari */
const GENRE_FACETS = [
  {
    values: ['Jangari'],
    aliases: [
      'jangari',
      'jangari kino',
      'jangaricha kino',
      'action',
      'aksion',
      // RU
      'боевик',
      'экшен',
      'экшн',
      'боевики',
    ],
  },
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
      // RU
      'военный',
      'военные',
      'война',
    ],
  },
  {
    values: ['Triller'],
    aliases: ['triller', 'thriller', /* RU */ 'триллер', 'триллеры'],
  },
  {
    values: ['Sarguzasht'],
    aliases: [
      'sarguzasht',
      'sarguzashat',
      'sargizasht',
      'adventure',
      // RU
      'приключения',
      'приключение',
      'приключенческий',
      'приключенческие',
    ],
  },
  {
    values: ["Qo'rqinchli"],
    aliases: [
      'qorqinchli',
      'qorqinch',
      'horror',
      'horrr',
      'horr',
      'daxshat',
      'dahshat',
      'daxshatli',
      'daxshatli kino',
      // RU
      'ужас',
      'ужасы',
      'хоррор',
      'страшный',
      'страшные',
    ],
  },
  {
    values: ['Komediya'],
    aliases: ['komediya', 'comedy', 'komedik', /* RU */ 'комедия', 'комедии', 'комический'],
  },
  {
    values: ['Drama'],
    aliases: ['drama', /* RU */ 'драма', 'драмы', 'драматический'],
  },
  {
    values: ['Romantik', 'Romantika'],
    aliases: [
      'romantik',
      'romantika',
      'romance',
      'sevgi',
      // RU
      'романтика',
      'романтический',
      'романтические',
      'любовный',
      'любовные',
    ],
  },
  {
    values: ['Fantastika'],
    aliases: [
      'fantastika',
      'fantasy',
      'fantastik',
      // RU
      'фантастика',
      'фэнтези',
      'фантастический',
      'фантастические',
    ],
  },
  {
    values: ['Multfilim', 'Animatsiya'],
    aliases: [
      'multfilim',
      'multfilm',
      'multik',
      'animatsiya',
      'cartoon',
      // RU
      'мультфильм',
      'мультфильмы',
      'мультик',
      'мультики',
      'анимация',
      'анимационный',
    ],
  },
  {
    values: ['Anime'],
    aliases: ['anime', /* RU */ 'аниме'],
  },
  {
    values: ['Kriminal'],
    aliases: [
      'kriminal',
      'crime',
      'detektiv kriminal',
      // RU
      'криминал',
      'криминальный',
      'криминальные',
    ],
  },
  {
    values: ['Detektiv'],
    aliases: ['detektiv', 'detective', /* RU */ 'детектив', 'детективы'],
  },
  {
    values: ['Oilaviy'],
    aliases: ['oilaviy', 'family', /* RU */ 'семейный', 'семейные', 'семейное'],
  },
  {
    values: ['Biografiya'],
    aliases: ['biografiya', 'biography', /* RU */ 'биография', 'биографический', 'биографические'],
  },
  {
    values: ['Tarixiy'],
    aliases: ['tarixiy', 'historical', 'history', /* RU */ 'исторический', 'исторические', 'история'],
  },
  {
    values: ['Sport'],
    aliases: ['sport', 'sportiv', /* RU */ 'спорт', 'спортивный', 'спортивные'],
  },
  {
    values: ['Vestern'],
    aliases: ['vestern', 'western', /* RU */ 'вестерн', 'вестерны'],
  },
];

/**
 * Country + genre + year.
 * Year avval parse → tokenlar olib tashlanadi → country/genre/title toza qoladi.
 */
const parseMovieSearchFacets = (rawQuery) =>
  attachYearFacet(rawQuery, (cleaned) =>
    parseCountryGenreFacets(cleaned, COUNTRY_FACETS, GENRE_FACETS, NOISE_WORDS)
  );

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
