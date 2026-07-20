/**
 * Kinolar + aktyorlar bo'yicha qidiruv (filterGenre, filterCountry, typeCategory)
 * So'zma-so'z va imlo xatolariga chidamli (fuzzy). Aktyorlar natijada doim yuqorida.
 */

const normalize = (s) => (s || '').toLowerCase().trim();

const getTitleForLang = (movie, lang) => {
  if (!movie?.title) return '';
  if (typeof movie.title === 'object') {
    return movie.title[lang] || movie.title.uz || movie.title.ru || '';
  }
  return String(movie.title);
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

const titleMatchScore = (movie, q, queryWords) => {
  const uz = normalize(getTitleForLang(movie, 'uz'));
  const ru = normalize(getTitleForLang(movie, 'ru'));
  if (uz.includes(q) || ru.includes(q)) return 2;
  if (titleMatchesAllWords(uz, ru, queryWords)) return 1;
  return 0;
};

const metaMatchesQuery = (movie, queryWords) => {
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

const searchMoviesOrdered = (q, queryWords, moviesList = []) => {
  const byTitle = [];
  const byMeta = [];
  const movies = Array.isArray(moviesList) ? moviesList : [];

  for (const m of movies) {
    const score = titleMatchScore(m, q, queryWords);
    if (score > 0) byTitle.push({ movie: m, score });
    else if (metaMatchesQuery(m, queryWords)) byMeta.push(m);
  }

  byTitle.sort((a, b) => b.score - a.score);
  const titleMovies = byTitle.map((x) => x.movie);
  const titleIds = new Set(titleMovies.map((m) => m.id));
  const metaOnly = byMeta.filter((m) => !titleIds.has(m.id));
  return [...titleMovies, ...metaOnly];
};

/**
 * Aktyorlar birinchi, keyin kinolar. `limit` jami elementlar soni.
 */
export const searchContentByQuery = (
  query,
  contentLang = 'uz',
  limit = 20,
  { actors: actorsList = [], movies: moviesList = [] } = {}
) => {
  const q = normalize(query);
  if (!q) return { actors: [], movies: [] };

  const queryWords = q.split(/\s+/).filter((w) => w.length >= 1);
  const actors = Array.isArray(actorsList) ? actorsList : [];

  const actorScored = [];
  for (const a of actors) {
    const score = actorMatchScore(a, q, queryWords);
    if (score > 0) actorScored.push({ actor: a, score });
  }
  actorScored.sort((x, y) => y.score - x.score);
  const matchedActors = actorScored.map((x) => x.actor);

  const allMoviesOrdered = searchMoviesOrdered(q, queryWords, moviesList);

  const actorSlice = matchedActors.slice(0, limit);
  const rest = limit - actorSlice.length;
  const movieSlice = rest > 0 ? allMoviesOrdered.slice(0, rest) : [];

  return { actors: actorSlice, movies: movieSlice };
};

/** Faqat kinolar ro'yxati */
export const searchMoviesByQuery = (query, contentLang = 'uz', limit = 20, moviesList = []) => {
  const q = normalize(query);
  if (!q) return [];
  const queryWords = q.split(/\s+/).filter((w) => w.length >= 1);
  return searchMoviesOrdered(q, queryWords, moviesList).slice(0, limit);
};
