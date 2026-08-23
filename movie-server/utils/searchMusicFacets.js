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

/** DB music.country qiymatlari + foydalanuvchi sinonimlari (kelajakdagi musiqalar uchun ham) */
const MUSIC_COUNTRY_FACETS = [
  { values: ['usa', 'USA'], aliases: ['usa', 'amerika', 'america', 'aqsh', 'shtat', 'united states'] },
  {
    values: ['uzbekistan', 'Uzbekistan', 'Uzbekiston'],
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
    values: ['britaniya', 'uk', 'UK'],
    aliases: ['britaniya', 'uk', 'ingliz', 'angliya', 'britain', 'england', 'buyuk britaniya'],
  },
  { values: ['kanada', 'canada', 'Canada'], aliases: ['kanada', 'canada', 'kanadacha'] },
  {
    values: ['korea', 'Korea'],
    aliases: ['korea', 'koreya', 'korean', 'koreys', 'koreyscha', 'karischa', 'karea'],
  },
  {
    values: ['saudi', 'Saudi'],
    aliases: ['saudi', 'saud', 'arabiston', 'saudiya', 'saudiya arabiston', 'arabcha'],
  },
  { values: ['egypt', 'Egypt'], aliases: ['egypt', 'misr', 'egyptian', 'misrlik'] },
  {
    values: ['uae', 'UAE'],
    aliases: ['uae', 'dubai', 'arab amirliklari', 'emirates', 'abu dabi', 'dubaycha'],
  },
  {
    values: ['Turkey', 'turkey', 'turkiya'],
    aliases: ['turkey', 'turkiya', 'turk', 'turukcha', 'turkcha'],
  },
  { values: ['japan', 'Japan'], aliases: ['japan', 'yaponiya', 'yapon', 'yaponcha'] },
  {
    values: ['qozogiston', "Qozog'iston", 'kazakhstan'],
    aliases: ['qozogiston', "qozog'iston", 'qozoq', 'qozoqcha', 'kazakhstan'],
  },
  {
    values: ['ispaniya', 'spain', 'Spain', 'ispaniyacha', 'ispancha'],
    aliases: ['ispaniya', 'spain', 'ispancha', 'ispaniyacha', 'spanish', 'ispaniyalik'],
  },
  {
    values: ['italiya', 'italy', 'Italy'],
    aliases: ['italiya', 'italy', 'italyan', 'italyancha', 'italian'],
  },
  {
    values: ['germaniya', 'germany', 'Germany'],
    aliases: ['germaniya', 'germany', 'german', 'nemis', 'nemischa'],
  },
  {
    values: ['fransiya', 'france', 'France'],
    aliases: ['fransiya', 'france', 'fransuz', 'fransuzcha', 'french'],
  },
  {
    values: ['xitoy', 'china', 'China', 'Xitoy'],
    aliases: ['xitoy', 'china', 'xita', 'xtoy', 'chinese', 'xitoycha'],
  },
  {
    values: ['india', 'India', 'hindiston'],
    aliases: ['india', 'hind', 'hindiston', 'hindcha', 'indian'],
  },
  {
    values: ['braziliya', 'brazil', 'Brazil'],
    aliases: ['braziliya', 'brazil', 'brazilian', 'braziliyalik'],
  },
  {
    values: ['meksika', 'mexico', 'Mexico'],
    aliases: ['meksika', 'mexico', 'mexican', 'meksikacha'],
  },
  {
    values: ['argentina', 'Argentina'],
    aliases: ['argentina', 'argentinacha', 'argentinalik'],
  },
  {
    values: ['avstraliya', 'australia', 'Australia'],
    aliases: ['avstraliya', 'australia', 'avstraliyalik'],
  },
  {
    values: ['niderlandiya', 'netherlands', 'Holland'],
    aliases: ['niderlandiya', 'netherlands', 'gollandiya', 'holland', 'dutch'],
  },
  {
    values: ['shvetsiya', 'sweden', 'Sweden'],
    aliases: ['shvetsiya', 'sweden', 'shved', 'swedish'],
  },
  {
    values: ['norvegiya', 'norway', 'Norway'],
    aliases: ['norvegiya', 'norway', 'norwegian'],
  },
  {
    values: ['finlyandiya', 'finland', 'Finland'],
    aliases: ['finlyandiya', 'finland', 'finnish', 'fin'],
  },
  {
    values: ['polsha', 'poland', 'Poland'],
    aliases: ['polsha', 'poland', 'polish', 'polyak'],
  },
  {
    values: ['ukraina', 'ukraine', 'Ukraine'],
    aliases: ['ukraina', 'ukraine', 'ukraincha', 'ukrainian'],
  },
  {
    values: ['belarus', 'Belarus'],
    aliases: ['belarus', 'belorussiya', 'belaruscha'],
  },
  {
    values: ['ozarbayjon', 'azerbaijan', 'Azerbaijan'],
    aliases: ['ozarbayjon', 'azerbaijan', 'ozarbayjoncha'],
  },
  {
    values: ['gruziya', 'georgia', 'Georgia'],
    aliases: ['gruziya', 'georgia', 'gruzin', 'gruzinch'],
  },
  {
    values: ['armaniston', 'armenia', 'Armenia'],
    aliases: ['armaniston', 'armenia', 'arman', 'armancha'],
  },
  {
    values: ['tojikiston', 'tajikistan', 'Tajikistan'],
    aliases: ['tojikiston', 'tajikistan', 'tojik', 'tojikcha'],
  },
  {
    values: ['qirgiziston', 'kyrgyzstan', 'Kyrgyzstan'],
    aliases: ['qirgiziston', 'kyrgyzstan', 'qirgiz', 'qirgizcha'],
  },
  {
    values: ['turkmaniston', 'turkmenistan', 'Turkmenistan'],
    aliases: ['turkmaniston', 'turkmenistan', 'turkman', 'turkmancha'],
  },
  {
    values: ['pokiston', 'pakistan', 'Pakistan'],
    aliases: ['pokiston', 'pakistan', 'pokistoncha'],
  },
  {
    values: ['eron', 'iran', 'Iran'],
    aliases: ['eron', 'iran', 'fors', 'persian', 'eroncha'],
  },
  {
    values: ['iraq', 'Iraq'],
    aliases: ['iraq', 'iroq', 'iraqi'],
  },
  {
    values: ['marokash', 'morocco', 'Morocco'],
    aliases: ['marokash', 'morocco', 'moroccan'],
  },
  {
    values: ['nigeriya', 'nigeria', 'Nigeria'],
    aliases: ['nigeriya', 'nigeria', 'nigerian'],
  },
  {
    values: ['janubiy afrika', 'south africa', 'South Africa'],
    aliases: ['janubiy afrika', 'south africa', 'safrica'],
  },
  {
    values: ['tailand', 'thailand', 'Thailand', 'Tailand'],
    aliases: ['tailand', 'thailand', 'tayland', 'tailandcha', 'taylandcha'],
  },
  {
    values: ['vetnam', 'vietnam', 'Vietnam'],
    aliases: ['vetnam', 'vietnam', 'vietnamese'],
  },
  {
    values: ['indoneziya', 'indonesia', 'Indonesia'],
    aliases: ['indoneziya', 'indonesia', 'indonesian'],
  },
  {
    values: ['malaysia', 'Malaysia', 'malayziya'],
    aliases: ['malaysia', 'malayziya', 'malaysian'],
  },
  {
    values: ['filippin', 'philippines', 'Philippines'],
    aliases: ['filippin', 'philippines', 'filippincha'],
  },
  {
    values: ['singapur', 'singapore', 'Singapore'],
    aliases: ['singapur', 'singapore'],
  },
  {
    values: ['gretsiya', 'greece', 'Greece'],
    aliases: ['gretsiya', 'greece', 'greek', 'yunon'],
  },
  {
    values: ['portugaliya', 'portugal', 'Portugal'],
    aliases: ['portugaliya', 'portugal', 'portuguese'],
  },
  {
    values: ['shveytsariya', 'switzerland', 'Switzerland'],
    aliases: ['shveytsariya', 'switzerland', 'swiss'],
  },
  {
    values: ['avstriya', 'austria', 'Austria'],
    aliases: ['avstriya', 'austria', 'austrian'],
  },
  {
    values: ['belgiya', 'belgium', 'Belgium'],
    aliases: ['belgiya', 'belgium', 'belgian'],
  },
  {
    values: ['irlandiya', 'ireland', 'Ireland'],
    aliases: ['irlandiya', 'ireland', 'irish'],
  },
  {
    values: ['shotlandiya', 'scotland', 'Scotland'],
    aliases: ['shotlandiya', 'scotland', 'scottish'],
  },
  {
    values: ['kolumbiya', 'colombia', 'Colombia'],
    aliases: ['kolumbiya', 'colombia', 'colombian'],
  },
  {
    values: ['chili', 'chile', 'Chile'],
    aliases: ['chili', 'chile', 'chilean'],
  },
  {
    values: ['kuba', 'cuba', 'Cuba'],
    aliases: ['kuba', 'cuba', 'cuban'],
  },
  {
    values: ['yamayka', 'jamaica', 'Jamaica'],
    aliases: ['yamayka', 'jamaica', 'jamaican'],
  },
  {
    values: ['isroil', 'israel', 'Israel'],
    aliases: ['isroil', 'israel', 'israeli'],
  },
  {
    values: ['livan', 'lebanon', 'Lebanon'],
    aliases: ['livan', 'lebanon', 'lebanese'],
  },
  {
    values: ['iordaniya', 'jordan', 'Jordan'],
    aliases: ['iordaniya', 'jordan', 'jordanian'],
  },
  {
    values: ['quvayt', 'kuwait', 'Kuwait'],
    aliases: ['quvayt', 'kuwait'],
  },
  {
    values: ['qatar', 'Qatar'],
    aliases: ['qatar', 'qatarlik'],
  },
  {
    values: ['bahrayn', 'bahrain', 'Bahrain'],
    aliases: ['bahrayn', 'bahrain'],
  },
  {
    values: ['oman', 'Oman'],
    aliases: ['oman'],
  },
  {
    values: ['mongoliya', 'mongolia', 'Mongolia'],
    aliases: ['mongoliya', 'mongolia', 'mongol'],
  },
  {
    values: ['afgoniston', 'afghanistan', 'Afghanistan'],
    aliases: ['afgoniston', 'afghanistan', 'afgon'],
  },
  {
    values: ['bangladesh', 'Bangladesh'],
    aliases: ['bangladesh', 'bangladeshcha'],
  },
  {
    values: ['nepal', 'Nepal'],
    aliases: ['nepal', 'nepalcha'],
  },
  {
    values: ['shri lanka', 'sri lanka', 'Sri Lanka'],
    aliases: ['shri lanka', 'sri lanka', 'srilanka'],
  },
  {
    values: ['yangilandiya', 'new zealand', 'New Zealand'],
    aliases: ['yangilandiya', 'new zealand', 'newzealand'],
  },
];


/** DB music.genre qiymatlari + foydalanuvchi sinonimlari */
const MUSIC_GENRE_FACETS = [
  {
    values: ['electronic', 'Electronic'],
    aliases: ['electronic', 'elektron', 'elektronika', 'edm', 'elektron musiqa'],
  },
  { values: ['dubstep'], aliases: ['dubstep', 'dabstep', 'dub step'] },
  { values: ['bass'], aliases: ['bass', 'bes', 'deep bass'] },
  {
    values: ['pop'],
    aliases: ['pop', 'pop musiqa', 'pop music'],
  },
  {
    values: ['k-pop', 'kpop', 'k pop', 'K-pop', 'karischa pop', 'karis pop'],
    aliases: ['k-pop', 'kpop', 'k pop', 'korean pop', 'koreys pop', 'karischa pop', 'karis pop'],
  },
  {
    values: ['j-pop', 'jpop', 'J-pop'],
    aliases: ['j-pop', 'jpop', 'j pop', 'japanese pop', 'yapon pop'],
  },
  {
    values: ['hip-hop', 'Rap'],
    aliases: ['hip-hop', 'hiphop', 'hip hop', 'rap', 'rep', 'repp', 'hip-hop musiqa'],
  },
  {
    values: ['trap'],
    aliases: ['trap', 'trap musiqa'],
  },
  {
    values: ['drill'],
    aliases: ['drill', 'drill musiqa'],
  },
  {
    values: ['phonk'],
    aliases: ['phonk', 'fonk'],
  },
  { values: ['jazz'], aliases: ['jazz', 'jaz', 'jazz musiqa'] },
  { values: ['Rock'], aliases: ['rock', 'rok', 'rock musiqa'] },
  {
    values: ['hard rock', 'Hard Rock'],
    aliases: ['hard rock', 'hardrok', 'qattiq rok'],
  },
  {
    values: ['metal', 'Metal'],
    aliases: ['metal', 'metall', 'heavy metal', 'hevi metal'],
  },
  {
    values: ['punk', 'Punk'],
    aliases: ['punk', 'pank', 'punk rock'],
  },
  {
    values: ['alternative', 'Alternative'],
    aliases: ['alternative', 'alternativ', 'alt rock'],
  },
  {
    values: ['indie', 'Indie'],
    aliases: ['indie', 'indi', 'indie musiqa'],
  },
  {
    values: ['grunge'],
    aliases: ['grunge', 'granj'],
  },
  {
    values: ['nasheed'],
    aliases: ['nasheed', 'nashid', 'islomiy', 'islamic'],
  },
  { values: ['opera'], aliases: ['opera', 'opera musiqa'] },
  {
    values: ['classical', 'Classical'],
    aliases: [
      'classical',
      'klassik',
      'klassika',
      'klassik musiqa',
      'classic',
      'klassic',
      'kliccika',
      'klaccik',
      'gamgin',
      "g'amgin",
      'ghamgin',
    ],
  },
  {
    values: ['blues', 'Blues'],
    aliases: ['blues', 'blyuz', 'blues musiqa', 'gamgin', "g'amgin", 'ghamgin'],
  },
  {
    values: ['reggae', 'Reggae'],
    aliases: ['reggae', 'reggi', 'rege'],
  },
  {
    values: ['r&b', 'rnb', 'R&B', 'RnB'],
    aliases: ['r&b', 'rnb', 'r and b', 'rhythm and blues'],
  },
  {
    values: ['soul', 'Soul'],
    aliases: ['soul', 'soul musiqa'],
  },
  {
    values: ['funk', 'Funk'],
    aliases: ['funk', 'fank'],
  },
  {
    values: ['disco', 'Disco'],
    aliases: ['disco', 'disko', 'disco musiqa'],
  },
  {
    values: ['house', 'House'],
    aliases: ['house', 'haus', 'house musiqa'],
  },
  {
    values: ['techno', 'Techno'],
    aliases: ['techno', 'texno', 'techno musiqa'],
  },
  {
    values: ['trance', 'Trance'],
    aliases: ['trance', 'trans'],
  },
  {
    values: ['drum and bass', 'dnb', 'DnB'],
    aliases: ['drum and bass', 'dnb', 'drum n bass', 'drumnbass'],
  },
  {
    values: ['ambient', 'Ambient'],
    aliases: ['ambient', 'ambient musiqa'],
  },
  {
    values: ['lofi', 'lo-fi', 'Lo-Fi'],
    aliases: ['lofi', 'lo-fi', 'lo fi', 'lofay'],
  },
  {
    values: ['chill', 'chillout', 'Chill'],
    aliases: ['chill', 'chillout', 'chill out', 'rilaks'],
  },
  {
    values: ['synthwave', 'Synthwave'],
    aliases: ['synthwave', 'sintveyv', 'retrowave'],
  },
  {
    values: ['folk', 'Folk'],
    aliases: ['folk', 'folklor', 'xalq', 'xalq musiqa', 'folk musiqa'],
  },
  {
    values: ['country', 'Country'],
    aliases: ['country music', 'kantri', 'country musiqa', 'kantri musiqa'],
  },
  {
    values: ['traditional', 'Traditional'],
    aliases: ['traditional', 'ananaviy', "an'anaviy", 'milliy', 'milliy musiqa'],
  },
  {
    values: ['maqom', 'Maqom'],
    aliases: ['maqom', 'makom', 'maqom musiqa'],
  },
  {
    values: ['estrada', 'Estrada'],
    aliases: ['estrada', 'estrada musiqa'],
  },
  {
    values: ['latin', 'Latin', 'Latino'],
    aliases: ['latin', 'latino', 'latina', 'lotin', 'latin musiqa'],
  },
  {
    values: ['salsa', 'Salsa'],
    aliases: ['salsa', 'salsa musiqa'],
  },
  {
    values: ['reggaeton', 'Reggaeton'],
    aliases: ['reggaeton', 'reggeton', 'regeton'],
  },
  {
    values: ['flamenco', 'Flamenco'],
    aliases: ['flamenco', 'flamenko'],
  },
  {
    values: ['tango', 'Tango'],
    aliases: ['tango', 'tango musiqa'],
  },
  {
    values: ['samba', 'Samba'],
    aliases: ['samba'],
  },
  {
    values: ['bossa nova', 'Bossa Nova'],
    aliases: ['bossa nova', 'bossanova', 'bossa'],
  },
  {
    values: ['afrobeat', 'Afrobeats'],
    aliases: ['afrobeat', 'afrobeats', 'afro beat'],
  },
  {
    values: ['arabic', 'Arabic', 'arab'],
    aliases: ['arabic', 'arab', 'arabcha musiqa', 'arab musiqa'],
  },
  {
    values: ['arabesk', 'Arabesk'],
    aliases: ['arabesk', 'arabeska'],
  },
  {
    values: ['shanson', 'chanson', 'Shanson'],
    aliases: ['shanson', 'chanson', 'shanson musiqa'],
  },
  {
    values: ['gospel', 'Gospel'],
    aliases: ['gospel', 'gospel musiqa'],
  },
  {
    values: ['dance', 'Dance'],
    aliases: ['dance', 'dans', 'raqs', 'dance musiqa', 'raqs musiqa'],
  },
  {
    values: ['ballad', 'Ballad'],
    aliases: ['ballad', 'ballada', 'ballad musiqa', 'gamgin', "g'amgin", 'ghamgin'],
  },
  {
    values: ['romance', 'Romance'],
    aliases: ['romance', 'romans', 'romantik', 'romantik musiqa', 'gamgin', "g'amgin", 'ghamgin'],
  },
  {
    values: ['acoustic', 'Acoustic'],
    aliases: ['acoustic', 'akustik', 'akustika'],
  },
  {
    values: ['instrumental', 'Instrumental'],
    aliases: ['instrumental', 'instrumental musiqa', 'sozsiz'],
  },
  {
    values: ['soundtrack', 'OST', 'ost'],
    aliases: ['soundtrack', 'ost', 'saundtrek', 'film musiqa'],
  },
  {
    values: ['world', 'World'],
    aliases: ['world', 'world music', 'jahon musiqa'],
  },
  {
    values: ['children', 'Kids'],
    aliases: ['children', 'kids', 'bolalar', 'bolalar musiqa', 'child'],
  },
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
