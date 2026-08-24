/**
 * Umumiy facet engine.
 * Kino / musiqa / (keyin klip) — bir xil fuzzy/parse logikasi shu yerda.
 * Har bir domain fayli faqat o'z values + aliases + noise so'zlarini beradi.
 */

const normalizeText = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[''`ʻʼ']/g, '')
    .replace(/o'/g, 'o')
    .replace(/g'/g, 'g')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
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

const getQueryWords = (text) => normalizeText(text).split(/\s+/).filter(Boolean);

/**
 * Facet alias faqat to'liq so'z yoki aniq ibora sifatida mos keladi.
 * "musiqalar" ichidagi "qalar" → "qatar" noto'g'ri match bo'lmasligi uchun.
 */
const aliasMatchesInQuery = (rawQuery, alias) => {
  const query = normalizeText(rawQuery);
  const normalizedAlias = normalizeText(alias);
  if (!query || !normalizedAlias || normalizedAlias.length < 3) return false;

  if (normalizedAlias.includes(' ')) {
    if (query.includes(normalizedAlias)) return true;
    const queryCompact = query.replace(/\s/g, '');
    const aliasCompact = normalizedAlias.replace(/\s/g, '');
    if (aliasCompact.length >= 3 && queryCompact.includes(aliasCompact)) return true;
    return aliasCompact.length >= 4 && wordSimilarity(queryCompact, aliasCompact) >= 0.72;
  }

  const words = getQueryWords(query);
  if (words.includes(normalizedAlias)) return true;
  return words.some((word) => {
    if (word.length < 3 || normalizedAlias.length < 3) return false;
    return wordSimilarity(word, normalizedAlias) >= 0.72;
  });
};

const stripNoise = (text, noiseWords = []) => {
  let result = text;
  for (const noise of [...noiseWords].sort((a, b) => b.length - a.length)) {
    result = result.replace(new RegExp(escapeRegExp(noise), 'g'), ' ');
  }
  return result.replace(/\s+/g, ' ').trim();
};

const extractFacetMatches = (rawQuery, facetList, noiseWords = []) => {
  const original = stripNoise(normalizeText(rawQuery), noiseWords);
  let working = original;
  const matchedValues = new Set();
  const usedTokens = new Set();

  // Har bir facetni asl query bo'yicha tekshiramiz —
  // bir xil alias (masalan g'amgin) bir nechta mavjud janrga tegishi mumkin.
  for (const facet of facetList) {
    let matchedAlias = null;
    for (const alias of facet.aliases) {
      const normalizedAlias = normalizeText(alias);
      if (normalizedAlias.length < 3) continue;
      if (aliasMatchesInQuery(original, normalizedAlias)) {
        matchedAlias = normalizedAlias;
        break;
      }
    }
    if (!matchedAlias) continue;
    facet.values.forEach((v) => matchedValues.add(v));
    usedTokens.add(matchedAlias);

    // Fuzzy typo ("horrr"≈"horror") — querydagi haqiqiy so'zni ham olib tashla
    if (!matchedAlias.includes(' ')) {
      for (const word of getQueryWords(original)) {
        if (word === matchedAlias) {
          usedTokens.add(word);
          continue;
        }
        if (word.length < 3 || matchedAlias.length < 3) continue;
        if (wordSimilarity(word, matchedAlias) >= 0.72) usedTokens.add(word);
      }
    }
  }

  for (const token of usedTokens) {
    working = working.replace(new RegExp(escapeRegExp(token), 'g'), ' ');
  }
  working = working.replace(/\s+/g, ' ').trim();
  working = stripNoise(working, noiseWords);
  return { values: [...matchedValues], remainder: working };
};

/**
 * Country + genre facet parse (kino/musiqa/klip uchun umumiy).
 */
const parseCountryGenreFacets = (rawQuery, countryFacets, genreFacets, noiseWords = []) => {
  const normalized = normalizeText(rawQuery);
  const countryResult = extractFacetMatches(normalized, countryFacets, noiseWords);
  const genreResult = extractFacetMatches(countryResult.remainder, genreFacets, noiseWords);

  const remainder = stripNoise(genreResult.remainder, noiseWords);
  const titleTokens = remainder.split(/\s+/).filter((w) => w.length >= 2);

  return {
    countryTargets: countryResult.values,
    genreTargets: genreResult.values,
    titleTokens,
    isFacetSearch: countryResult.values.length > 0 || genreResult.values.length > 0,
  };
};

const hasFacetIntent = (queryWords, facetList) =>
  queryWords.some((qw) =>
    facetList.some((f) => f.aliases.some((a) => aliasMatchesInQuery(qw, a)))
  );

const matchSingleField = (dbValue, targets, queryWords, facetList) => {
  const dbVal = String(dbValue || '').trim();
  if (!dbVal) return false;

  if (targets.some((target) => facetValueMatches(target, dbVal))) return true;

  return queryWords.some((qw) => {
    if (normalizeText(qw).length < 3) return false;
    for (const facet of facetList) {
      if (!facet.aliases.some((a) => aliasMatchesInQuery(qw, a))) continue;
      if (facet.values.some((v) => facetValueMatches(v, dbVal))) return true;
    }
    return facetValueMatches(qw, dbVal);
  });
};

const matchMultiField = (dbValues, targets, queryWords, facetList) => {
  const list = Array.isArray(dbValues) ? dbValues : [dbValues].filter(Boolean);
  if (!list.length) return false;

  if (targets.some((target) => list.some((g) => facetValueMatches(target, g)))) return true;

  return queryWords.some((qw) => {
    if (normalizeText(qw).length < 3) return false;
    for (const facet of facetList) {
      if (!facet.aliases.some((a) => aliasMatchesInQuery(qw, a))) continue;
      if (facet.values.some((v) => list.some((g) => facetValueMatches(v, g)))) return true;
    }
    return list.some((g) => facetValueMatches(qw, g));
  });
};

/**
 * Umumiy facet ball.
 * countryValue — string (filterCountry / country)
 * genreValue — string yoki array (filterGenre / genre)
 */
const countryGenreFacetScore = (
  { countryValue, genreValue },
  facets,
  queryWords,
  countryFacets,
  genreFacets
) => {
  const { countryTargets, genreTargets, isFacetSearch } = facets;
  if (!isFacetSearch && countryTargets.length === 0 && genreTargets.length === 0) return 0;

  const hasCountryIntent = countryTargets.length > 0 || hasFacetIntent(queryWords, countryFacets);
  const hasGenreIntent = genreTargets.length > 0 || hasFacetIntent(queryWords, genreFacets);

  const countryOk =
    !hasCountryIntent || matchSingleField(countryValue, countryTargets, queryWords, countryFacets);

  const genreIsArray = Array.isArray(genreValue);
  const genreOk =
    !hasGenreIntent ||
    (genreIsArray
      ? matchMultiField(genreValue, genreTargets, queryWords, genreFacets)
      : matchSingleField(genreValue, genreTargets, queryWords, genreFacets));

  if (!countryOk || !genreOk) return 0;
  if (hasCountryIntent && hasGenreIntent) return 76;
  if (hasCountryIntent || hasGenreIntent) return 72;
  return 0;
};

module.exports = {
  normalizeText,
  fuzzyIncludes,
  facetValueMatches,
  stripNoise,
  extractFacetMatches,
  parseCountryGenreFacets,
  matchSingleField,
  matchMultiField,
  countryGenreFacetScore,
};
