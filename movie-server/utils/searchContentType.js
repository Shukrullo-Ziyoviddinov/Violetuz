/**
 * Kontent turi qidiruvi (content type).
 * Hozir: kinolar + musiqa + klip + konsert + albom
 *
 * Keyin tavsiya algoritmi resolve*ByType orqali ulanadi.
 */

const MOVIE_TYPE_ALIASES = [
  'kino',
  'kinolar',
  'kinolari',
  'filmi',
  'film',
  'filmlar',
  'filmlari',
  'movie',
  'movies',
  'serial',
  'seriallar',
  'seriallari',
];

const MUSIC_TYPE_ALIASES = [
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

const CLIP_TYPE_ALIASES = [
  'klip',
  'klips',
  'kliplar',
  'kliplari',
  'clip',
  'clips',
  'music video',
  'musicvideo',
  'videoklip',
  'video klip',
  'video kliplar',
  'video clip',
  'video cliplar',
];

const CONCERT_TYPE_ALIASES = [
  'konsert',
  'konserts',
  'konsertlar',
  'konsertlari',
  'concert',
  'concerts',
  'live',
  'live show',
  'liveshow',
  'jonli',
  'jonli konsert',
  'video konsert',
  'video konsertlar',
];

const ALBUM_TYPE_ALIASES = [
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
];

/**
 * Tur bilan birga yoziladigan so'zlar — janr/davlat emas.
 * "yangi kinolar", "musiqa to'plami", "yangi albomlar" → ham type search.
 */
const SHARED_INTENT_WORDS = [
  'yangi',
  'yangilar',
  'yangisi',
  'toplam',
  'toplami',
  'toplamlar',
  'toplamlari',
  'collection',
  'collections',
  'royhat',
  'royxat',
  'royhati',
  'royxati',
  'katalog',
  'barcha',
  'hamma',
  'eng',
  'oxirgi',
  'soʻnggi',
  'songgi',
];

const MOVIE_INTENT_WORDS = SHARED_INTENT_WORDS;
const MUSIC_INTENT_WORDS = SHARED_INTENT_WORDS;
const CLIP_INTENT_WORDS = SHARED_INTENT_WORDS;
const CONCERT_INTENT_WORDS = SHARED_INTENT_WORDS;
const ALBUM_INTENT_WORDS = SHARED_INTENT_WORDS;

const normalizeText = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[''`ʻʼ']/g, '')
    .replace(/o'/g, 'o')
    .replace(/g'/g, 'g')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripWords = (text, aliases) => {
  let result = text;
  for (const alias of [...aliases].sort((a, b) => b.length - a.length)) {
    const normalized = normalizeText(alias);
    if (normalized.length < 2) continue;
    result = result.replace(new RegExp(`\\b${escapeRegExp(normalized)}\\b`, 'g'), ' ');
  }
  return result.replace(/\s+/g, ' ').trim();
};

const matchPureType = (q, typeAliases, intentWords, type) => {
  const afterType = stripWords(q, typeAliases);
  const hasType = afterType.length < q.length;
  if (!hasType) return null;

  const remainder = stripWords(afterType, intentWords);
  if (!remainder) {
    return { type, isPureTypeSearch: true };
  }
  return null;
};

/**
 * So'rov faqat kontent turi ekanini aniqlaydi.
 * "kinolar" → movie, "musiqa" → music, "kliplar" → clip,
 * "konsertlar" → concert, "albomlar" → album
 */
const parseContentType = (rawQuery) => {
  const q = normalizeText(rawQuery);
  if (!q) {
    return { type: null, isPureTypeSearch: false };
  }

  const movie = matchPureType(q, MOVIE_TYPE_ALIASES, MOVIE_INTENT_WORDS, 'movie');
  if (movie) return movie;

  const music = matchPureType(q, MUSIC_TYPE_ALIASES, MUSIC_INTENT_WORDS, 'music');
  if (music) return music;

  const clip = matchPureType(q, CLIP_TYPE_ALIASES, CLIP_INTENT_WORDS, 'clip');
  if (clip) return clip;

  const concert = matchPureType(q, CONCERT_TYPE_ALIASES, CONCERT_INTENT_WORDS, 'concert');
  if (concert) return concert;

  const album = matchPureType(q, ALBUM_TYPE_ALIASES, ALBUM_INTENT_WORDS, 'album');
  if (album) return album;

  return { type: null, isPureTypeSearch: false };
};

const applyLimit = (list, limit) => {
  if (limit != null && limit > 0) return list.slice(0, limit);
  return list;
};

const resolveMoviesByType = (moviesList = [], options = {}) => {
  const list = Array.isArray(moviesList) ? moviesList : [];
  return applyLimit(list, options.limit ?? null);
};

const resolveMusicByType = (musicList = [], options = {}) => {
  const list = Array.isArray(musicList) ? musicList : [];
  return applyLimit(list, options.limit ?? null);
};

const resolveClipsByType = (clipsList = [], options = {}) => {
  const list = Array.isArray(clipsList) ? clipsList : [];
  return applyLimit(list, options.limit ?? null);
};

/**
 * Hozir: barcha konsertlar (limit yo'q).
 * Keyin: tavsiya algoritmi shu yerga ulanadi.
 */
const resolveConcertsByType = (concertsList = [], options = {}) => {
  const list = Array.isArray(concertsList) ? concertsList : [];
  return applyLimit(list, options.limit ?? null);
};

/**
 * Hozir: barcha albomlar (limit yo'q).
 * Keyin: tavsiya algoritmi shu yerga ulanadi.
 */
const resolveAlbumsByType = (albumsList = [], options = {}) => {
  const list = Array.isArray(albumsList) ? albumsList : [];
  return applyLimit(list, options.limit ?? null);
};

const resolveContentTypeResults = (contentType, data = {}, options = {}) => {
  const empty = {
    actors: [],
    musicArtists: [],
    movies: [],
    music: [],
    albums: [],
    clips: [],
    concerts: [],
  };

  if (!contentType?.isPureTypeSearch || !contentType.type) {
    return null;
  }

  if (contentType.type === 'movie') {
    return {
      ...empty,
      movies: resolveMoviesByType(data.movies, options),
    };
  }

  if (contentType.type === 'music') {
    return {
      ...empty,
      music: resolveMusicByType(data.music, options),
    };
  }

  if (contentType.type === 'clip') {
    return {
      ...empty,
      clips: resolveClipsByType(data.clips, options),
    };
  }

  if (contentType.type === 'concert') {
    return {
      ...empty,
      concerts: resolveConcertsByType(data.concerts, options),
    };
  }

  if (contentType.type === 'album') {
    return {
      ...empty,
      albums: resolveAlbumsByType(data.albums, options),
    };
  }

  return empty;
};

module.exports = {
  parseContentType,
  resolveMoviesByType,
  resolveMusicByType,
  resolveClipsByType,
  resolveConcertsByType,
  resolveAlbumsByType,
  resolveContentTypeResults,
  MOVIE_TYPE_ALIASES,
  MUSIC_TYPE_ALIASES,
  CLIP_TYPE_ALIASES,
  CONCERT_TYPE_ALIASES,
  ALBUM_TYPE_ALIASES,
  MOVIE_INTENT_WORDS,
  MUSIC_INTENT_WORDS,
  CLIP_INTENT_WORDS,
  CONCERT_INTENT_WORDS,
  ALBUM_INTENT_WORDS,
};
