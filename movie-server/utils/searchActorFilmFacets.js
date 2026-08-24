/**
 * Aktyor → kino qidiruv intent.
 * "leonardo kinolari", "leonardo uynagan kinolari", "leonardo bosh ruldagi kinolari"
 * → bir xil: aktyor + unga biriktirilgan kinolar (rol filter yo'q).
 *
 * "bosh rol" / "uynagan" / "rolidagi" — faqat noise (title emas).
 */

const { normalizeText } = require('./searchFacetEngine');

/**
 * Aktyor-film filler so'zlar — title token bo'lmasligi kerak.
 * Lead/support ajratilmaydi; hammasi bir xil intent.
 */
const ACTOR_FILM_NOISE_WORDS = [
  'uynagan',
  'uygan',
  'oynagan',
  "o'ynagan",
  'suratga',
  'tushgan',
  'ishtirokidagi',
  'ishtirok',
  'rolidagi',
  'rolida',
  'rollari',
  'rollarida',
  'rol',
  'rulidagi',
  'rulida',
  'ruldagi',
  'rulga',
  'ruli',
  'bosh',
  'boshi',
  'boshrul',
  'boshruldagi',
  'asosiy',
  'qahramon',
  'qahramoni',
  'qahramonlari',
  'ishlab',
  'ishlagan',
  'ishlangan',
  'chiqarilgan',
  'chiqarilgani',
  'olingan',
  'yaratilgan',
  'ekranga',
  'ekranlashtirilgan',
  'premyera',
  'premiera',
  'premierasi',
  'prokat',
  'prokatga',
  'starred',
  'starring',
  'played',
  'actor',
  'aktyor',
  'aktyori',
  'aktyorning',
  'aktrisa',
  'aktrisasi',
];

const hasActorFilmNoise = (rawQuery) => {
  const words = normalizeText(rawQuery).split(/\s+/).filter(Boolean);
  return words.some((w) => ACTOR_FILM_NOISE_WORDS.includes(w));
};

module.exports = {
  ACTOR_FILM_NOISE_WORDS,
  hasActorFilmNoise,
};
