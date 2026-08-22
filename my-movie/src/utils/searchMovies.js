/**
 * Umumiy qidiruv: kinolar, aktyorlar, musiqa, albomlar, kliplar, konsertlar, artistlar.
 * So'zma-so'z va imlo xatolariga chidamli (fuzzy).
 */

import { ensureArray } from './musicDataUtils';

const normalize = (s) => (s || '').toLowerCase().trim();

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

const fuzzyMatch = (queryWord, titleWord) => {
  if (!queryWord || queryWord.length < 2) return false;
  if (titleWord.includes(queryWord) || queryWord.includes(titleWord)) return true;
  if (queryWord.length >= 3 && titleWord.length >= 3) {
    const d = levenshtein(queryWord, titleWord);
    const maxDist = queryWord.length <= 4 ? 1 : Math.min(2, Math.floor(queryWord.length / 2));
    return d <= maxDist;
  }
  return false;
};

const titleMatchesAllWords = (textA, textB, queryWords) => {
  const wordsA = normalize(textA).split(/\s+/).filter(Boolean);
  const wordsB = normalize(textB).split(/\s+/).filter(Boolean);
  const pool = [...wordsA, ...wordsB];
  return queryWords.every(
    (qw) => pool.some((tw) => tw.includes(qw) || qw.includes(tw) || fuzzyMatch(qw, tw))
  );
};

const titleMatchScore = (item, q, queryWords) => {
  const uz = normalize(getTitleForLang(item, 'uz'));
  const ru = normalize(getTitleForLang(item, 'ru'));
  if (uz.includes(q) || ru.includes(q)) return 2;
  if (titleMatchesAllWords(uz, ru, queryWords)) return 1;
  return 0;
};

const movieMetaMatchesQuery = (movie, queryWords) => {
  const genreUz = (movie.filterGenre || movie.genre?.uz || []).join(' ').toLowerCase();
  const genreRu = (movie.genre?.ru || []).join(' ').toLowerCase();
  const country = String(movie.filterCountry || '').toLowerCase();
  const typeCat = (movie.typeCategory || []).join(' ').toLowerCase();
  const blob = `${genreUz} ${genreRu} ${country} ${typeCat}`;
  return queryWords.some((w) => blob.includes(w));
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

/** Ism + bio */
const actorMatchScore = (actor, q, queryWords) => {
  const nameUz = normalize(getActorName(actor, 'uz'));
  const nameRu = normalize(getActorName(actor, 'ru'));
  const bioUz = normalize(actor?.bio?.text?.uz || '').slice(0, 1000);
  const bioRu = normalize(actor?.bio?.text?.ru || '').slice(0, 1000);

  if (nameUz.includes(q) || nameRu.includes(q)) return 2;
  if (q.length >= 2 && (bioUz.includes(q) || bioRu.includes(q))) return 2;
  if (titleMatchesAllWords(nameUz, nameRu || nameUz, queryWords)) return 1;
  if (titleMatchesAllWords(bioUz, bioRu, queryWords)) return 1;
  return 0;
};

const musicArtistMatchScore = (artist, q, queryWords) => {
  const name = normalize(String(artist?.name || ''));
  if (name.includes(q)) return 2;
  if (titleMatchesAllWords(name, name, queryWords)) return 1;
  return 0;
};

const musicItemMatchScore = (item, q, queryWords, artistsList) => {
  const titleUz = normalize(getTitleForLang(item, 'uz'));
  const titleRu = normalize(getTitleForLang(item, 'ru'));
  const artistName = normalize(getMusicArtistName(item, artistsList));
  const blobUz = `${titleUz} ${artistName}`;
  const blobRu = `${titleRu} ${artistName}`;
  if (blobUz.includes(q) || blobRu.includes(q)) return 2;
  if (titleMatchesAllWords(blobUz, blobRu, queryWords)) return 1;
  return 0;
};

const albumMatchScore = (album, q, queryWords, artistsList) => {
  const title = normalize(String(album.title || ''));
  const artist = normalize(getMusicArtistName(album, artistsList));
  const songsBlob = ensureArray(album.songs)
    .map((s) => `${normalize(String(s.title || ''))} ${normalize(String(s.artist || ''))}`)
    .join(' ');
  const blob = `${title} ${artist} ${songsBlob}`;
  if (blob.includes(q)) return 2;
  if (titleMatchesAllWords(blob, blob, queryWords)) return 1;
  return 0;
};

const musicMetaMatchesQuery = (item, queryWords) => {
  const genre = normalize(String(item.genre || ''));
  const country = normalize(String(item.country || ''));
  const language = normalize(String(item.language || ''));
  const type = normalize(String(item.type || ''));
  const blob = `${genre} ${country} ${language} ${type}`;
  return queryWords.some((w) => blob.includes(w));
};

const searchMoviesOrdered = (q, queryWords, moviesList = []) => {
  const byTitle = [];
  const byMeta = [];
  const movies = Array.isArray(moviesList) ? moviesList : [];

  for (const m of movies) {
    const score = titleMatchScore(m, q, queryWords);
    if (score > 0) byTitle.push({ movie: m, score });
    else if (movieMetaMatchesQuery(m, queryWords)) byMeta.push(m);
  }

  byTitle.sort((a, b) => b.score - a.score);
  const titleMovies = byTitle.map((x) => x.movie);
  const titleIds = new Set(titleMovies.map((m) => m.id));
  const metaOnly = byMeta.filter((m) => !titleIds.has(m.id));
  return [...titleMovies, ...metaOnly];
};

const searchScoredList = (items, q, queryWords, matchFn, metaFn, extraArg) => {
  const byTitle = [];
  const byMeta = [];
  for (const item of items) {
    const score = matchFn(item, q, queryWords, extraArg);
    if (score > 0) byTitle.push({ item, score });
    else if (metaFn(item, queryWords)) byMeta.push(item);
  }
  byTitle.sort((a, b) => b.score - a.score);
  const titleItems = byTitle.map((x) => x.item);
  const titleIds = new Set(titleItems.map((m) => m.id));
  const metaOnly = byMeta.filter((m) => !titleIds.has(m.id));
  return [...titleItems, ...metaOnly];
};

const searchActorsOrdered = (q, queryWords, actorsList = []) => {
  const scored = [];
  for (const a of actorsList) {
    const score = actorMatchScore(a, q, queryWords);
    if (score > 0) scored.push({ actor: a, score });
  }
  scored.sort((x, y) => y.score - x.score);
  return scored.map((x) => x.actor);
};

const searchMusicArtistsOrdered = (q, queryWords, artistsList = []) => {
  const scored = [];
  for (const a of artistsList) {
    const score = musicArtistMatchScore(a, q, queryWords);
    if (score > 0) scored.push({ artist: a, score });
  }
  scored.sort((x, y) => y.score - x.score);
  return scored.map((x) => x.artist);
};

/**
 * Aktyorlar, musiqa artistlari, kinolar, musiqa/albom/klip/konsert – bitta qidiruv.
 */
export const searchContentByQuery = (
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
  const q = normalize(query);
  if (!q) {
    return { actors: [], musicArtists: [], movies: [], music: [], albums: [], clips: [], concerts: [] };
  }

  const queryWords = q.split(/\s+/).filter((w) => w.length >= 1);
  const perCategory = 10;

  const actors = searchActorsOrdered(q, queryWords, actorsList).slice(0, 8);
  const musicArtists = searchMusicArtistsOrdered(q, queryWords, musicArtistsList).slice(0, 8);
  const movies = searchMoviesOrdered(q, queryWords, moviesList).slice(0, 20);

  const music = searchScoredList(
    ensureArray(musicList),
    q,
    queryWords,
    musicItemMatchScore,
    musicMetaMatchesQuery,
    musicArtistsList
  ).slice(0, perCategory);

  const albums = searchScoredList(
    ensureArray(albumsList),
    q,
    queryWords,
    albumMatchScore,
    musicMetaMatchesQuery,
    musicArtistsList
  ).slice(0, perCategory);

  const clips = searchScoredList(
    ensureArray(clipsList),
    q,
    queryWords,
    musicItemMatchScore,
    musicMetaMatchesQuery,
    musicArtistsList
  ).slice(0, perCategory);

  const concerts = searchScoredList(
    ensureArray(concertsList),
    q,
    queryWords,
    musicItemMatchScore,
    musicMetaMatchesQuery,
    musicArtistsList
  ).slice(0, perCategory);

  return { actors, musicArtists, movies, music, albums, clips, concerts };
};

/** Faqat kinolar ro'yxati */
export const searchMoviesByQuery = (query, contentLang = 'uz', limit = 20, moviesList = []) => {
  const q = normalize(query);
  if (!q) return [];
  const queryWords = q.split(/\s+/).filter((w) => w.length >= 1);
  return searchMoviesOrdered(q, queryWords, moviesList).slice(0, limit);
};
