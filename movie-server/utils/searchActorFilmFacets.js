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
  // RU
  'играл',
  'играла',
  'сыграл',
  'сыграла',
  'снимался',
  'снималась',
  'участвовал',
  'участвовала',
  'участие',
  'роли',
  'роль',
  'ролях',
  'главной',
  'главная',
  'главный',
  'главную',
  'герой',
  'героиня',
  'персонаж',
  'снят',
  'снята',
  'выпущен',
  'выпущена',
  'создан',
  'создана',
  'экран',
  'экранизация',
  'премьера',
  'прокат',
  'актер',
  'актёр',
  'актера',
  'актёра',
  'актриса',
  'актрисы',
];

const hasActorFilmNoise = (rawQuery) => {
  const words = normalizeText(rawQuery).split(/\s+/).filter(Boolean);
  return words.some((w) => ACTOR_FILM_NOISE_WORDS.includes(w));
};

module.exports = {
  ACTOR_FILM_NOISE_WORDS,
  hasActorFilmNoise,
};
