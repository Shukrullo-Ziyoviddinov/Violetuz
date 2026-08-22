/**
 * Kino qidiruv facetlari: filterCountry va filterGenre.
 * Foydalanuvchi "Amerika kinolari", "xitoykinolari", "Jangari filmlar" deb yozganda
 * title emas, DB dagi filterCountry / filterGenre orqali topiladi.
 */

const NOISE_WORDS = [
  'kino',
  'kinolar',
  'kinolari',
  'filmi',
  'film',
  'filmlar',
  'filmlari',
  'serial',
  'seriallar',
  'seriallari',
  'movie',
  'movies',
  'tarjima',
  'tarjimada',
  'tilida',
];

/** DB filterCountry qiymatlari + foydalanuvchi sinonimlari */
const COUNTRY_FACETS = [
  { values: ['USA'], aliases: ['usa', 'amerika', 'america', 'aqsh', 'united states', 'shtat'] },
  { values: ['Korea'], aliases: ['korea', 'koreya', 'korean', 'koreys', 'koreyscha', 'karischa', 'karea'] },
  { values: ['Xitoy', 'China'], aliases: ['xitoy', 'china', 'xita', 'xtoy', 'chinese', 'xitoycha'] },
  { values: ['Japan'], aliases: ['japan', 'yaponiya', 'yapon', 'anime yapon'] },
  { values: ['India'], aliases: ['india', 'hind', 'hindiston', 'hindcha'] },
  { values: ['Russia'], aliases: ['russia', 'rossiya', 'rassiya', 'rassia', 'rus', 'ruscha'] },
  { values: ['UK'], aliases: ['uk', 'britaniya', 'ingliz', 'angliya'] },
  { values: ['Turkey'], aliases: ['turkey', 'turkiya', 'turk', 'turukcha'] },
  { values: ['Germaniya'], aliases: ['germaniya', 'german', 'germany'] },
  { values: ['Fransiya'], aliases: ['fransiya', 'france', 'fransuz', 'fransuzcha'] },
  { values: ['Italiya'], aliases: ['italiya', 'italy', 'italyan'] },
  { values: ['Tailand'], aliases: ['tailand', 'thailand', 'tayland', 'tailandcha', 'taylandcha'] },
  { values: ['Uzbekiston', 'Uzbekistan'], aliases: ['uzbekiston', 'uzbek', 'ozbek', 'o zbek', 'o\'zbek', 'ozbekcha', 'o\'zbekcha', 'uzbekcha', 'ozb', 'uzb'] },
  { values: ["Qozog'iston"], aliases: ['qozogiston', 'qozog\'iston', 'qozoq', 'qozoqcha', 'kazakhstan'] },
];

/** DB filterGenre qiymatlari + foydalanuvchi sinonimlari */
const GENRE_FACETS = [
  { values: ['Jangari'], aliases: ['jangari', 'jangari kino', 'jangaricha kino', 'action', 'aksion'] },
  {
    values: ['Boevik', 'Jangari'],
    aliases: [
      'boevik',
      'boevik kino',
      'olish kino',
      'otishma',
      'oteshema',
      'urush kino',
      'jaxon urushi',
      'jahon urushi',
    ],
  },
  { values: ['Triller'], aliases: ['triller', 'thriller'] },
  { values: ['Sarguzasht'], aliases: ['sarguzasht', 'sarguzasht', 'sargizasht', 'adventure'] },
  { values: ["Qo'rqinchli"], aliases: ['qorqinchli', 'qorqinch', 'horror', 'daxshat', 'dahshat', 'daxshatli', 'daxshatli kino'] },
  { values: ['Komediya'], aliases: ['komediya', 'comedy', 'komedik'] },
  { values: ['Drama'], aliases: ['drama'] },
  { values: ['Romantik', 'Romantika'], aliases: ['romantik', 'romantika', 'romance', 'sevgi'] },
  { values: ['Fantastika'], aliases: ['fantastika', 'fantasy', 'fantastik'] },
  { values: ['Multfilim', 'Animatsiya'], aliases: ['multfilim', 'multfilm', 'multik', 'animatsiya', 'cartoon'] },
  { values: ['Anime'], aliases: ['anime'] },
  { values: ['Kriminal'], aliases: ['kriminal', 'crime', 'detektiv kriminal'] },
  { values: ['Detektiv'], aliases: ['detektiv', 'detective'] },
  { values: ['Oilaviy'], aliases: ['oilaviy', 'family'] },
  { values: ['Biografiya'], aliases: ['biografiya', 'biography'] },
  { values: ['Tarixiy'], aliases: ['tarixiy', 'historical', 'history'] },
  { values: ['Sport'], aliases: ['sport', 'sportiv'] },
  { values: ['Vestern'], aliases: ['vestern', 'western'] },
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
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
};

const fuzzyIncludes = (haystack, needle) => {
  if (!haystack || !needle) return false;
  if (haystack.includes(needle)) return true;
  if (needle.length < 4) return false;

  for (let i = 0; i < haystack.length; i++) {
    for (let len = Math.max(needle.length - 1, 4); len <= needle.length + 1; len++) {
      const slice = haystack.slice(i, i + len);
      if (slice.length < 4) continue;
      const sim = wordSimilarity(needle, slice);
      if (slice.length < needle.length && sim < 0.85) continue;
      if (sim >= 0.72) return true;
    }
  }
  return false;
};

const facetValueMatches = (queryToken, dbValue) => {
  const q = normalizeText(queryToken);
  const db = normalizeText(dbValue);
  if (!q || !db) return false;
  if (q === db) return true;
  if (db.includes(q) || q.includes(db)) return true;
  return wordSimilarity(q, db) >= 0.72;
};

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripNoise = (text) => {
  let result = text;
  for (const noise of NOISE_WORDS.sort((a, b) => b.length - a.length)) {
    result = result.replace(new RegExp(escapeRegExp(noise), 'g'), ' ');
  }
  return result.replace(/\s+/g, ' ').trim();
};

const extractFacetMatches = (rawQuery, facetList) => {
  let working = normalizeText(rawQuery);
  const matchedValues = new Set();

  for (const facet of facetList) {
    let facetHit = false;
    for (const alias of facet.aliases) {
      const normalizedAlias = normalizeText(alias);
      if (normalizedAlias.length < 3) continue;
      if (fuzzyIncludes(working, normalizedAlias)) {
        facet.values.forEach((v) => matchedValues.add(v));
        working = working.replace(new RegExp(escapeRegExp(normalizedAlias), 'g'), ' ');
        facetHit = true;
        break;
      }
    }
    if (!facetHit) {
      for (const alias of facet.aliases) {
        const normalizedAlias = normalizeText(alias);
        if (normalizedAlias.length >= 3 && wordSimilarity(working.replace(/\s/g, ''), normalizedAlias) >= 0.72) {
          facet.values.forEach((v) => matchedValues.add(v));
          facetHit = true;
          break;
        }
      }
    }
  }

  working = stripNoise(working);
  return { values: [...matchedValues], remainder: working };
};

/**
 * Qidiruv matnidan country/genre facet va qolgan title tokenlarni ajratadi.
 * "Xitoykinolari" → country: Xitoy/China, titleTokens: []
 */
const parseMovieSearchFacets = (rawQuery) => {
  const normalized = normalizeText(rawQuery);
  const countryResult = extractFacetMatches(normalized, COUNTRY_FACETS);
  const genreResult = extractFacetMatches(countryResult.remainder, GENRE_FACETS);

  let remainder = stripNoise(genreResult.remainder);
  const titleTokens = remainder.split(/\s+/).filter((w) => w.length >= 2);

  return {
    countryTargets: countryResult.values,
    genreTargets: genreResult.values,
    titleTokens,
    isFacetSearch: countryResult.values.length > 0 || genreResult.values.length > 0,
  };
};

const matchFilterCountry = (filterCountry, countryTargets, queryWords = []) => {
  const dbVal = String(filterCountry || '').trim();
  if (!dbVal) return false;

  if (countryTargets.some((target) => facetValueMatches(target, dbVal))) return true;

  return queryWords.some((qw) => {
    if (normalizeText(qw).length < 3) return false;
    for (const facet of COUNTRY_FACETS) {
      if (!facet.aliases.some((a) => fuzzyIncludes(normalizeText(qw), normalizeText(a)))) continue;
      if (facet.values.some((v) => facetValueMatches(v, dbVal))) return true;
    }
    return facetValueMatches(qw, dbVal);
  });
};

const matchFilterGenre = (filterGenre, genreTargets, queryWords = []) => {
  const genres = Array.isArray(filterGenre) ? filterGenre : [filterGenre].filter(Boolean);
  if (!genres.length) return false;

  if (genreTargets.some((target) => genres.some((g) => facetValueMatches(target, g)))) return true;

  return queryWords.some((qw) => {
    if (normalizeText(qw).length < 3) return false;
    for (const facet of GENRE_FACETS) {
      if (!facet.aliases.some((a) => fuzzyIncludes(normalizeText(qw), normalizeText(a)))) continue;
      if (facet.values.some((v) => genres.some((g) => facetValueMatches(v, g)))) return true;
    }
    return genres.some((g) => facetValueMatches(qw, g));
  });
};

/** filterCountry + filterGenre bo'yicha facet ball */
const movieFacetMatchScore = (movie, facets, queryWords) => {
  const { countryTargets, genreTargets, titleTokens, isFacetSearch } = facets;
  if (!isFacetSearch && countryTargets.length === 0 && genreTargets.length === 0) return 0;

  const hasCountryIntent = countryTargets.length > 0 || queryWords.some((qw) =>
    COUNTRY_FACETS.some((f) => f.aliases.some((a) => fuzzyIncludes(normalizeText(qw), normalizeText(a))))
  );
  const hasGenreIntent = genreTargets.length > 0 || queryWords.some((qw) =>
    GENRE_FACETS.some((f) => f.aliases.some((a) => fuzzyIncludes(normalizeText(qw), normalizeText(a))))
  );

  const countryOk = !hasCountryIntent || matchFilterCountry(movie.filterCountry, countryTargets, queryWords);
  const genreOk = !hasGenreIntent || matchFilterGenre(movie.filterGenre, genreTargets, queryWords);

  if (!countryOk || !genreOk) return 0;

  if (hasCountryIntent && hasGenreIntent) return 76;
  if (hasCountryIntent || hasGenreIntent) return 72;

  return 0;
};

module.exports = {
  parseMovieSearchFacets,
  movieFacetMatchScore,
  matchFilterCountry,
  matchFilterGenre,
  normalizeText,
};
