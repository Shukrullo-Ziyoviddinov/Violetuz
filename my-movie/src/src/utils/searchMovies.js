/**
 * Kinolar + aktyorlar bo'yicha qidiruv (filterGenre, filterCountry, typeCategory)
 * So'zma-so'z va imlo xatolariga chidamli (fuzzy). Aktyorlar natijada doim yuqorida.
 * Backend qo'shilganda API ga almashtiriladi
 */
import { actors } from '../data/actors';
import { allMovies } from '../data/movies';

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
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
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

/** Kinolar: istalgan so'z mos kelsa (oldingi xulq) */
const titleMatchesAnyWord = (titleUz, titleRu, queryWords) => {
  const meaningful = queryWords.filter((w) => w.length >= 2);
  if (meaningful.length === 0) return false;
  const titleWordsUz = titleUz.split(/\s+/).filter(Boolean);
  const titleWordsRu = titleRu.split(/\s+/).filter(Boolean);
  for (const qw of meaningful) {
    const inUz = titleWordsUz.some((tw) => fuzzyMatch(qw, tw)) || titleUz.includes(qw);
    const inRu = titleWordsRu.some((tw) => fuzzyMatch(qw, tw)) || titleRu.includes(qw);
    if (inUz || inRu) return true;
  }
  return false;
};

/** Aktyorlar / bio: barcha so'zlar mos kelishi kerak — aks holda umumiy so'zlar barcha natijalarni beradi */
const titleMatchesAllWords = (titleUz, titleRu, queryWords) => {
  const meaningful = queryWords.filter((w) => w.length >= 2);
  if (meaningful.length === 0) return false;
  const titleWordsUz = titleUz.split(/\s+/).filter(Boolean);
  const titleWordsRu = titleRu.split(/\s+/).filter(Boolean);
  for (const qw of meaningful) {
    const inUz = titleWordsUz.some((tw) => fuzzyMatch(qw, tw)) || titleUz.includes(qw);
    const inRu = titleWordsRu.some((tw) => fuzzyMatch(qw, tw)) || titleRu.includes(qw);
    if (!inUz && !inRu) return false;
  }
  return true;
};

const metaMatchesQuery = (movie, queryWords) => {
  for (const qw of queryWords) {
    if (qw.length < 2) continue;
    const genres = Array.isArray(movie.filterGenre) ? movie.filterGenre : movie.filterGenre ? [movie.filterGenre] : [];
    for (const g of genres) {
      if (fuzzyMatch(qw, normalize(g))) return true;
    }
    if (movie.filterCountry && fuzzyMatch(qw, normalize(movie.filterCountry))) return true;
    const types = Array.isArray(movie.typeCategory) ? movie.typeCategory : movie.typeCategory ? [movie.typeCategory] : [];
    for (const t of types) {
      if (fuzzyMatch(qw, normalize(String(t)))) return true;
    }
  }
  return false;
};

const titleMatchScore = (movie, q, queryWords) => {
  const titleUz = normalize(getTitleForLang(movie, 'uz'));
  const titleRu = normalize(getTitleForLang(movie, 'ru'));
  if (titleUz.includes(q) || titleRu.includes(q)) return 2; // aniq sarlavha
  if (titleMatchesAnyWord(titleUz, titleRu, queryWords)) return 1; // so'zma-so'z/fuzzy
  return 0;
};

const getActorName = (actor, lang) => {
  const raw = actor?.name?.[lang];
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return '';
};

/** Ism + bio (kirillcha ism bo'lmasa ham bio dan topiladi). Bio uchun faqat aniq/fuzzy so'zlar ketma-ketligi — umumiy so'zlar barcha yozuvchilarni bermasligi uchun */
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

const searchMoviesOrdered = (q, queryWords) => {
  const byTitle = [];
  const byMeta = [];

  for (const m of allMovies) {
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
export const searchContentByQuery = (query, contentLang = 'uz', limit = 20) => {
  const q = normalize(query);
  if (!q) return { actors: [], movies: [] };

  const queryWords = q.split(/\s+/).filter((w) => w.length >= 1);

  const actorScored = [];
  for (const a of actors) {
    const score = actorMatchScore(a, q, queryWords);
    if (score > 0) actorScored.push({ actor: a, score });
  }
  actorScored.sort((x, y) => y.score - x.score);
  const matchedActors = actorScored.map((x) => x.actor);

  const allMoviesOrdered = searchMoviesOrdered(q, queryWords);

  const actorSlice = matchedActors.slice(0, limit);
  const rest = limit - actorSlice.length;
  const movieSlice = rest > 0 ? allMoviesOrdered.slice(0, rest) : [];

  return { actors: actorSlice, movies: movieSlice };
};

/** Faqat kinolar ro'yxati (oldingi API) */
export const searchMoviesByQuery = (query, contentLang = 'uz', limit = 20) => {
  const q = normalize(query);
  if (!q) return [];
  const queryWords = q.split(/\s+/).filter((w) => w.length >= 1);
  return searchMoviesOrdered(q, queryWords).slice(0, limit);
};
