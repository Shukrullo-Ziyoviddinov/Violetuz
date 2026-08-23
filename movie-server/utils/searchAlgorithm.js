/**
 * Professional qidiruv algoritmi.
 * - Aniq va qismiy ibora mosligi ("meniki emassan", "ana endi")
 * - Imlo xatolariga chidamli (shukurulo → Shukrullo)
 * - Noto'g'ri qismiy moslikni bloklaydi (sevara → era)
 * - Kategoriya qidiruvi (hind kinolar, korea kino)
 */

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);
const { parseMovieSearchFacets, movieFacetMatchScore } = require('./searchFacets');
const { parseContentType, resolveContentTypeResults } = require('./searchContentType');

const MIN_SCORE = 55;
const MIN_QUERY_LENGTH = 2;

/** Sinonim guruhlari — kategoriya qidiruvi uchun */
const SYNONYM_GROUPS = [
  ['kino', 'kinolar', 'film', 'filmlar', 'movie', 'movies', 'serial', 'seriallar'],
  ['hind', 'hindi', 'hindiston', 'india', 'indian'],
  ['korea', 'koreya', 'korean', 'janubiy', 'shimoliy'],
  ['tarjima', 'tarjimada', 'tilida', 'uzbek', 'o\'zbek', 'ozbek'],
  ['qasoskor', 'qasoskorlar', 'vengence', 'revenge'],
];

const normalizeText = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[''`ʻʼ]/g, '')
    .replace(/o'/g, 'o')
    .replace(/g'/g, 'g')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getTitleForLang = (item, lang) => {
  if (!item?.title) return '';
  if (typeof item.title === 'object') {
    return item.title[lang] || item.title.uz || item.title.ru || item.title.en || '';
  }
  return String(item.title);
};

const levenshtein = (a, b) => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
};

const wordSimilarity = (a, b) => {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / maxLen;
};

const expandSynonyms = (word) => {
  const w = normalizeText(word);
  for (const group of SYNONYM_GROUPS) {
    if (group.some((g) => normalizeText(g) === w || w.includes(normalizeText(g)))) {
      return group.map(normalizeText);
    }
  }
  return [w];
};

const isSubsequence = (needle, haystack) => {
  if (!needle || !haystack) return false;
  let i = 0;
  for (let j = 0; j < haystack.length; j++) {
    if (haystack[j] === needle[i]) i += 1;
    if (i === needle.length) return true;
  }
  return i === needle.length;
};

/** Ikki so'z o'rtasida imlo xatosi bilan moslik */
const wordsMatch = (queryWord, targetWord) => {
  const qw = normalizeText(queryWord);
  const tw = normalizeText(targetWord);
  if (!qw || !tw) return false;
  if (qw === tw) return true;

  // Matn ichida to'liq so'z/ibora (ketaver, qasoskorlar)
  if (qw.length >= 3 && tw.includes(qw)) return true;
  // Faqat deyarli teng uzunlikdagi so'zlar (sevara → vera bloklanadi)
  if (tw.length >= 5 && qw.length >= tw.length && qw.includes(tw) && tw.length >= qw.length * 0.75) {
    return true;
  }

  const sim = wordSimilarity(qw, tw);
  const maxLen = Math.max(qw.length, tw.length);

  if (maxLen >= 8 && sim >= 0.68) return true;
  if (maxLen >= 6 && sim >= 0.72) return true;
  if (maxLen >= 4 && sim >= 0.75) return true;
  if (maxLen === 3 && sim >= 0.66) return true;

  // og'ir imlo: moronnaxr → movarounnaxr
  if (qw.length >= 6 && tw.length >= qw.length && isSubsequence(qw, tw)) return true;

  return false;
};

/** So'z matn yoki sinonimlar bo'yicha mos kelishini tekshiradi */
const wordMatchesInBlob = (queryWord, blob) => {
  const text = normalizeText(blob);
  const qw = normalizeText(queryWord);
  if (!text || !qw) return false;

  if (text.includes(qw)) return true;

  const variants = expandSynonyms(qw);
  if (variants.some((v) => v.length >= 3 && text.includes(v))) return true;

  const words = text.split(/\s+/).filter(Boolean);
  return words.some((tw) => variants.some((v) => wordsMatch(v, tw) || wordsMatch(qw, tw)));
};

/** Barcha qidiruv so'zlari matnda mos kelishini tekshiradi */
const allWordsMatchInBlob = (queryWords, blob) =>
  queryWords.every((w) => wordMatchesInBlob(w, blob));

/**
 * Matn bo'yicha umumiy ball.
 * 100 — to'liq ibora, 90 — bitta so'z aniq, 80 — ko'p so'z, 70 — fuzzy
 */
const blobMatchScore = (q, queryWords, blob) => {
  const text = normalizeText(blob);
  if (!text) return 0;

  if (q.length >= MIN_QUERY_LENGTH && text.includes(q)) return 100;

  if (queryWords.length > 1) {
    if (allWordsMatchInBlob(queryWords, text)) return 82;
    return 0;
  }

  if (queryWords.length === 1) {
    const qw = queryWords[0];
    if (qw.length >= 3 && text.includes(qw)) return 92;

    const words = text.split(/\s+/).filter(Boolean);
    if (words.some((tw) => wordsMatch(qw, tw))) return 78;

    if (qw.length >= 4) {
      const bestSim = Math.max(...words.map((tw) => wordSimilarity(qw, tw)), 0);
      if (bestSim >= 0.72) return 70;
    }
  }

  return 0;
};

/** Ism qidiruvi — artist/aktyor uchun qattiqroq + imlo tolerant */
const nameMatchScore = (q, queryWords, nameBlob) => {
  const text = normalizeText(nameBlob);
  if (!text) return 0;

  if (q.length >= MIN_QUERY_LENGTH && text.includes(q)) return 100;

  if (queryWords.length === 1) {
    const qw = queryWords[0];
    const nameWords = text.split(/\s+/).filter(Boolean);

    if (nameWords.some((nw) => wordsMatch(qw, nw))) return 95;

    const compact = text.replace(/\s/g, '');
    const compactQ = qw.replace(/\s/g, '');
    if (compactQ.length >= 4 && wordSimilarity(compactQ, compact) >= 0.68) return 88;
    if (compactQ.length >= 6 && isSubsequence(compactQ, compact)) return 85;

    if (nameWords.some((nw) => wordSimilarity(qw, nw) >= 0.72)) return 80;
  }

  if (queryWords.length > 1 && allWordsMatchInBlob(queryWords, text)) return 90;

  return 0;
};

const getActorName = (actor, lang) => {
  if (!actor?.name) return '';
  if (typeof actor.name === 'object') {
    return actor.name[lang] || actor.name.uz || actor.name.ru || '';
  }
  return String(actor.name);
};

const getMusicArtistName = (item, artistsList = []) => {
  if (item?.artist) return String(item.artist);
  const artist = artistsList.find((a) => a.id === item.artistId);
  return artist?.name || item.artistId || '';
};

const movieMatchScore = (movie, q, queryWords) => {
  const titleUz = getTitleForLang(movie, 'uz');
  const titleRu = getTitleForLang(movie, 'ru');
  const facets = parseMovieSearchFacets(q);

  const titleSearchWords =
    facets.titleTokens.length > 0 ? facets.titleTokens : facets.isFacetSearch ? [] : queryWords;

  let score = 0;
  if (titleSearchWords.length > 0) {
    const titleQ = titleSearchWords.join(' ');
    score = Math.max(
      blobMatchScore(titleQ, titleSearchWords, titleUz),
      blobMatchScore(titleQ, titleSearchWords, titleRu),
      blobMatchScore(q, queryWords, titleUz),
      blobMatchScore(q, queryWords, titleRu)
    );
  } else if (!facets.isFacetSearch) {
    score = Math.max(blobMatchScore(q, queryWords, titleUz), blobMatchScore(q, queryWords, titleRu));
  }

  const facetScore = movieFacetMatchScore(movie, facets, queryWords);
  score = Math.max(score, facetScore);

  return score >= MIN_SCORE ? score : 0;
};

const actorMatchScore = (actor, q, queryWords) => {
  const nameUz = getActorName(actor, 'uz');
  const nameRu = getActorName(actor, 'ru');
  let score = Math.max(
    nameMatchScore(q, queryWords, nameUz),
    nameMatchScore(q, queryWords, nameRu)
  );

  if (score >= MIN_SCORE) return score;

  if (queryWords.length > 1) {
    const bioUz = actor?.bio?.text?.uz || '';
    const bioRu = actor?.bio?.text?.ru || '';
    score = Math.max(
      blobMatchScore(q, queryWords, bioUz),
      blobMatchScore(q, queryWords, bioRu)
    );
  }

  return score >= MIN_SCORE ? score : 0;
};

const musicArtistMatchScore = (artist, q, queryWords) => {
  const score = nameMatchScore(q, queryWords, artist?.name || '');
  return score >= MIN_SCORE ? score : 0;
};

const musicItemMatchScore = (item, q, queryWords, artistsList) => {
  const title = `${getTitleForLang(item, 'uz')} ${getTitleForLang(item, 'ru')}`;
  const artist = getMusicArtistName(item, artistsList);

  const titleScore = blobMatchScore(q, queryWords, title);
  const artistScore = nameMatchScore(q, queryWords, artist);

  let score = titleScore;

  // Bitta so'z — artist nomi bo'yicha (shukurulo → Shukrullo qo'shiqlari)
  if (queryWords.length === 1 && artistScore >= MIN_SCORE) {
    score = Math.max(score, artistScore);
  }

  // Ko'p so'z — faqat sarlavha/ibora (noto'g'ri artist match yo'q)
  if (queryWords.length > 1) {
    score = titleScore;
  }

  return score >= MIN_SCORE ? score : 0;
};

const albumMatchScore = (album, q, queryWords, artistsList) => {
  const title = String(album.title || '');
  const artist = getMusicArtistName(album, artistsList);
  const songsBlob = ensureArray(album.songs)
    .map((s) => `${String(s.title || '')} ${String(s.artist || '')}`)
    .join(' ');

  const blob = `${title} ${artist} ${songsBlob}`;
  let score = blobMatchScore(q, queryWords, blob);

  if (queryWords.length === 1) {
    const artistScore = nameMatchScore(q, queryWords, artist);
    if (artistScore >= MIN_SCORE) score = Math.max(score, artistScore);
  }

  return score >= MIN_SCORE ? score : 0;
};

const scoreAndSort = (items, scoreFn, ...args) => {
  const scored = [];
  for (const item of items) {
    const score = scoreFn(item, ...args);
    if (score >= MIN_SCORE) scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map((x) => x.item);
};

const searchContentByQuery = (
  query,
  contentLang = 'uz',
  limit = 40,
  {
    actors: actorsList = [],
    movies: moviesList = [],
    music: musicList = [],
    albums: albumsList = [],
    clips: clipsList = [],
    concerts: concertsList = [],
    musicArtists: musicArtistsList = [],
  } = {}
) => {
  const q = normalizeText(query);
  if (!q || q.length < MIN_QUERY_LENGTH) {
    return { actors: [], musicArtists: [], movies: [], music: [], albums: [], clips: [], concerts: [] };
  }

  // "kinolar" / "filmlar" — kontent turi (keyin tavsiya algoritmi shu yerda ulanadi)
  const contentType = parseContentType(q);
  if (contentType.isPureTypeSearch) {
    return resolveContentTypeResults(
      contentType,
      {
        movies: moviesList,
        music: musicList,
        clips: clipsList,
        concerts: concertsList,
        albums: albumsList,
      },
      { limit: null }
    );
  }

  const queryWords = q.split(/\s+/).filter((w) => w.length >= 1);
  const perCategory = 10;

  const actors = scoreAndSort(actorsList, (a) => actorMatchScore(a, q, queryWords)).slice(0, 8);
  const musicArtists = scoreAndSort(musicArtistsList, (a) => musicArtistMatchScore(a, q, queryWords)).slice(
    0,
    8
  );
  const movies = scoreAndSort(moviesList, (m) => movieMatchScore(m, q, queryWords)).slice(0, 20);

  const music = scoreAndSort(
    ensureArray(musicList),
    (item) => musicItemMatchScore(item, q, queryWords, musicArtistsList)
  ).slice(0, perCategory);

  const albums = scoreAndSort(
    ensureArray(albumsList),
    (item) => albumMatchScore(item, q, queryWords, musicArtistsList)
  ).slice(0, perCategory);

  const clips = scoreAndSort(
    ensureArray(clipsList),
    (item) => musicItemMatchScore(item, q, queryWords, musicArtistsList)
  ).slice(0, perCategory);

  const concerts = scoreAndSort(
    ensureArray(concertsList),
    (item) => musicItemMatchScore(item, q, queryWords, musicArtistsList)
  ).slice(0, perCategory);

  return { actors, musicArtists, movies, music, albums, clips, concerts };
};

module.exports = {
  searchContentByQuery,
};
