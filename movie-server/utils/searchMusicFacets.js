/**
 * Musiqa qidiruv facetlari: genre va country.
 * Umumiy engine → searchFacetEngine.js
 * Kino → searchFacets.js
 * Klip / konsert / albom — keyin.
 */

const {
  normalizeText,
  parseCountryGenreFacets,
  matchSingleField,
  countryGenreFacetScore,
} = require('./searchFacetEngine');

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
];

/** DB music.country qiymatlari + foydalanuvchi sinonimlari */
const MUSIC_COUNTRY_FACETS = [
  { values: ['usa'], aliases: ['usa', 'amerika', 'america', 'aqsh', 'shtat'] },
  {
    values: ['uzbekistan'],
    aliases: [
      'uzbekistan',
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
    values: ['russia', 'Russia'],
    aliases: ['russia', 'rossiya', 'rassiya', 'rassia', 'rus', 'ruscha'],
  },
  {
    values: ['britaniya'],
    aliases: ['britaniya', 'uk', 'ingliz', 'angliya', 'britain', 'england'],
  },
  { values: ['kanada'], aliases: ['kanada', 'canada'] },
  {
    values: ['korea'],
    aliases: ['korea', 'koreya', 'korean', 'koreys', 'koreyscha', 'karischa', 'karea'],
  },
  { values: ['saudi'], aliases: ['saudi', 'saud', 'arabiston', 'saudiya'] },
  { values: ['egypt'], aliases: ['egypt', 'misr', 'egyptian'] },
  { values: ['uae'], aliases: ['uae', 'dubai', 'arab amirliklari', 'emirates'] },
  { values: ['Turkey'], aliases: ['turkey', 'turkiya', 'turk', 'turukcha'] },
  { values: ['japan'], aliases: ['japan', 'yaponiya', 'yapon'] },
  {
    values: ['qozogiston'],
    aliases: ['qozogiston', "qozog'iston", 'qozoq', 'qozoqcha', 'kazakhstan'],
  },
];

/** DB music.genre qiymatlari + foydalanuvchi sinonimlari */
const MUSIC_GENRE_FACETS = [
  {
    values: ['electronic', 'Electronic'],
    aliases: ['electronic', 'elektron', 'elektronika', 'edm'],
  },
  { values: ['dubstep'], aliases: ['dubstep', 'dabstep', 'dub step'] },
  { values: ['bass'], aliases: ['bass', 'bes', 'deep bass'] },
  { values: ['pop'], aliases: ['pop', 'pop musiqa', 'pop music'] },
  {
    values: ['hip-hop', 'Rap'],
    aliases: ['hip-hop', 'hiphop', 'hip hop', 'rap', 'rep', 'repp', 'hip-hop musiqa'],
  },
  { values: ['jazz'], aliases: ['jazz', 'jaz', 'jazz musiqa'] },
  { values: ['Rock'], aliases: ['rock', 'rok', 'rock musiqa'] },
  {
    values: ['nasheed'],
    aliases: ['nasheed', 'nashid', 'islomiy', 'islamic'],
  },
  { values: ['opera'], aliases: ['opera', 'opera musiqa'] },
];

const parseMusicSearchFacets = (rawQuery) =>
  parseCountryGenreFacets(rawQuery, MUSIC_COUNTRY_FACETS, MUSIC_GENRE_FACETS, NOISE_WORDS);

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
