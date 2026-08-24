/**
 * Artist → musiqa / klip / konsert / albom qidiruv intent.
 * "jah khalib musiqalari", "jah khalib kuylagan kliplar",
 * "jah khalib 2025 rap musiqalari" → artist + unga biriktirilgan media.
 *
 * Rol/ijro filler so'zlari — title token emas.
 */

const { normalizeText } = require('./searchFacetEngine');

/**
 * Artist-media filler — title bo'lmasligi kerak.
 */
const ARTIST_MEDIA_NOISE_WORDS = [
  'kuylagan',
  'kuylaganlar',
  'kuylaganlari',
  'aytgan',
  'aytganlar',
  'ijro',
  'ijrochi',
  'ijrochisi',
  'ijro etgan',
  'ijroetgan',
  'chiqargan',
  'chiqargani',
  'yozgan',
  'yaratgan',
  'yaratgani',
  'ashulalari',
  'ashulasi',
  'qoʻshiqlari',
  "qo'shiqlari",
  'qoshiqlari',
  'singli',
  'singllari',
  'single',
  'singles',
  'trek',
  'treki',
  'treklari',
  'track',
  'tracks',
  'artist',
  'artisti',
  'artistning',
  'qoʻshiqchi',
  "qo'shiqchi",
  'qoshiqchi',
  'qoʻshiqchisi',
  "qo'shiqchisi",
  'qoshiqchisi',
  'singer',
  'performer',
  'performed',
  'sung',
  'sang',
  // RU
  'спел',
  'спела',
  'исполнил',
  'исполнила',
  'исполнение',
  'исполнитель',
  'исполнителя',
  'исполнители',
  'выпустил',
  'выпустила',
  'написал',
  'написала',
  'создал',
  'создала',
  'песни',
  'песня',
  'сингл',
  'синглы',
  'трек',
  'треки',
  'треков',
  'артист',
  'артиста',
  'артисты',
  'певец',
  'певицы',
  'певица',
  'певца',
];

const hasArtistMediaNoise = (rawQuery) => {
  const words = normalizeText(rawQuery).split(/\s+/).filter(Boolean);
  return words.some((w) => ARTIST_MEDIA_NOISE_WORDS.includes(w));
};

module.exports = {
  ARTIST_MEDIA_NOISE_WORDS,
  hasArtistMediaNoise,
};
