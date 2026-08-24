/**
 * Professional qidiruv algoritmi.
 * - Facet parse so'rov uchun 1 marta
 * - Aniq tur filtri (musiqalar / kliplar)
 * - Pagination (cursor + hasMore)
 */

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);
const { parseMovieSearchFacets, movieFacetMatchScore } = require('./searchFacets');
const { parseMusicSearchFacets, musicFacetMatchScore } = require('./searchMusicFacets');
const { parseClipSearchFacets, clipFacetMatchScore } = require('./searchClipFacets');
const { parseConcertSearchFacets, concertFacetMatchScore } = require('./searchConcertFacets');
const { parseAlbumSearchFacets, albumFacetMatchScore } = require('./searchAlbumFacets');
const { parseContentType, resolveContentTypeResults } = require('./searchContentType');

const MIN_SCORE = 55;
const MIN_QUERY_LENGTH = 2;

const DEFAULT_LIMITS = {
  actors: 8,
  musicArtists: 8,
  movies: 12,
  music: 10,
  albums: 10,
  clips: 10,
  concerts: 10,
};

const SEARCH_SECTIONS = [
  'actors',
  'musicArtists',
  'movies',
  'music',
  'albums',
  'clips',
  'concerts',
];

const SYNONYM_GROUPS = [
  ['kino', 'kinolar', 'film', 'filmlar', 'movie', 'movies', 'serial', 'seriallar'],
  ['hind', 'hindi', 'hindiston', 'india', 'indian'],
  ['korea', 'koreya', 'korean', 'janubiy', 'shimoliy'],
  ['tarjima', 'tarjimada', 'tilida', 'uzbek', "o'zbek", 'ozbek'],
  ['qasoskor', 'qasoskorlar', 'vengence', 'revenge'],
];

const normalizeText = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[''`ʻʼ']/g, '')
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
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
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

const wordsMatch = (queryWord, targetWord) => {
  const qw = normalizeText(queryWord);
  const tw = normalizeText(targetWord);
  if (!qw || !tw) return false;
  if (qw === tw) return true;
  if (qw.length >= 3 && tw.includes(qw)) return true;
  if (tw.length >= 5 && qw.length >= tw.length && qw.includes(tw) && tw.length >= qw.length * 0.75) {
    return true;
  }

  const sim = wordSimilarity(qw, tw);
  const maxLen = Math.max(qw.length, tw.length);
  if (maxLen >= 8 && sim >= 0.68) return true;
  if (maxLen >= 6 && sim >= 0.72) return true;
  if (maxLen >= 4 && sim >= 0.75) return true;
  if (maxLen === 3 && sim >= 0.66) return true;
  if (qw.length >= 6 && tw.length >= qw.length && isSubsequence(qw, tw)) return true;
  return false;
};

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

const allWordsMatchInBlob = (queryWords, blob) =>
  queryWords.every((w) => wordMatchesInBlob(w, blob));

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

const movieMatchScore = (movie, q, queryWords, facets) => {
  const titleUz = getTitleForLang(movie, 'uz');
  const titleRu = getTitleForLang(movie, 'ru');
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

  score = Math.max(score, movieFacetMatchScore(movie, facets, queryWords));
  return score >= MIN_SCORE ? score : 0;
};

const actorMatchScore = (actor, q, queryWords) => {
  const nameUz = getActorName(actor, 'uz');
  const nameRu = getActorName(actor, 'ru');
  let score = Math.max(nameMatchScore(q, queryWords, nameUz), nameMatchScore(q, queryWords, nameRu));
  if (score >= MIN_SCORE) return score;
  if (queryWords.length > 1) {
    const bioUz = actor?.bio?.text?.uz || '';
    const bioRu = actor?.bio?.text?.ru || '';
    score = Math.max(blobMatchScore(q, queryWords, bioUz), blobMatchScore(q, queryWords, bioRu));
  }
  return score >= MIN_SCORE ? score : 0;
};

const musicArtistMatchScore = (artist, q, queryWords) => {
  const score = nameMatchScore(q, queryWords, artist?.name || '');
  return score >= MIN_SCORE ? score : 0;
};

const mediaItemMatchScore = (item, q, queryWords, artistsList, facets, facetScoreFn) => {
  const title = `${getTitleForLang(item, 'uz')} ${getTitleForLang(item, 'ru')}`;
  const artist = getMusicArtistName(item, artistsList);
  const titleSearchWords =
    facets.titleTokens.length > 0 ? facets.titleTokens : facets.isFacetSearch ? [] : queryWords;

  let score = 0;
  if (titleSearchWords.length > 0) {
    const titleQ = titleSearchWords.join(' ');
    score = Math.max(
      blobMatchScore(titleQ, titleSearchWords, title),
      blobMatchScore(q, queryWords, title)
    );
  } else if (!facets.isFacetSearch) {
    score = blobMatchScore(q, queryWords, title);
  }

  if (!facets.isFacetSearch && queryWords.length === 1) {
    const artistScore = nameMatchScore(q, queryWords, artist);
    if (artistScore >= MIN_SCORE) score = Math.max(score, artistScore);
  }

  if (!facets.isFacetSearch && queryWords.length > 1) {
    score = Math.max(score, blobMatchScore(q, queryWords, title));
  }

  score = Math.max(score, facetScoreFn(item, facets, queryWords));
  return score >= MIN_SCORE ? score : 0;
};

const albumMatchScore = (album, q, queryWords, artistsList, facets) => {
  const title = String(album.title || '');
  const artist = getMusicArtistName(album, artistsList);
  const songsBlob = ensureArray(album.songs)
    .map((s) => `${String(s.title || '')} ${String(s.artist || '')}`)
    .join(' ');
  const titleSearchWords =
    facets.titleTokens.length > 0 ? facets.titleTokens : facets.isFacetSearch ? [] : queryWords;
  const blob = `${title} ${artist} ${songsBlob}`;
  let score = 0;

  if (titleSearchWords.length > 0) {
    const titleQ = titleSearchWords.join(' ');
    score = Math.max(
      blobMatchScore(titleQ, titleSearchWords, blob),
      blobMatchScore(q, queryWords, blob)
    );
  } else if (!facets.isFacetSearch) {
    score = blobMatchScore(q, queryWords, blob);
  }

  if (!facets.isFacetSearch && queryWords.length === 1) {
    const artistScore = nameMatchScore(q, queryWords, artist);
    if (artistScore >= MIN_SCORE) score = Math.max(score, artistScore);
  }

  score = Math.max(score, albumFacetMatchScore(album, facets, queryWords));
  return score >= MIN_SCORE ? score : 0;
};

const scoreAndSort = (items, scoreFn) => {
  const scored = [];
  for (const item of items) {
    const score = scoreFn(item);
    if (score >= MIN_SCORE) scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map((x) => x.item);
};

/** Item year — media: item.year, kino: specs.year */
const getItemYear = (item) => {
  const n = Number(item?.year ?? item?.specs?.year);
  return Number.isFinite(n) ? n : 0;
};

const itemMatchesYearFacet = (item, facets, getYear = getItemYear) => {
  if (!facets?.isYearSearch) return true;
  if (facets.yearMode === 'exact') {
    return getYear(item) === facets.year;
  }
  return true;
};

/**
 * Umumiy year rank: exact filter / recency DESC.
 * Kino, musiqa, klip, konsert, albom — bir xil algoritm.
 * actorIds berilsa — faqat shu aktyorlarga biriktirilgan kinolar.
 */
const movieHasAnyActor = (movie, actorIds) => {
  if (!actorIds?.length) return true;
  const list = ensureArray(movie?.actors).map((id) => String(id));
  if (!list.length) return false;
  return actorIds.some((id) => list.includes(String(id)));
};

const rankItemsByYearFacets = (items, facets, scoreFn, getYear = getItemYear, options = {}) => {
  const { actorIds = null, lightFacetScoreFn = null } = options;
  const noTitle = (facets.titleTokens || []).length === 0;
  const noCountry = (facets.countryTargets || []).length === 0;
  const noGenre = (facets.genreTargets || []).length === 0;

  const yearOnly =
    Boolean(facets?.isYearSearch) && noCountry && noGenre && noTitle;

  // Aktyor + (ixtiyoriy year/genre/country), title yo'q — engil yo'l
  const actorLinkedMode = Boolean(actorIds?.length) && noTitle;
  const actorCatalogOnly = actorLinkedMode && noCountry && noGenre;

  const scored = [];
  for (const item of ensureArray(items)) {
    if (actorIds?.length && !movieHasAnyActor(item, actorIds)) continue;
    if (!itemMatchesYearFacet(item, facets, getYear)) continue;

    let score;
    if (yearOnly || actorCatalogOnly) {
      score = MIN_SCORE;
    } else if (actorLinkedMode && lightFacetScoreFn) {
      // Actor+genre/country — title blob yo'q, faqat facet
      score = lightFacetScoreFn(item);
    } else {
      score = scoreFn(item);
    }
    if (score < MIN_SCORE) continue;
    scored.push({ item, score, year: getYear(item) });
  }

  if (facets?.yearMode === 'recency') {
    scored.sort((a, b) => b.year - a.year || b.score - a.score);
  } else if (facets?.yearMode === 'exact') {
    scored.sort((a, b) => b.score - a.score || b.year - a.year);
  } else {
    scored.sort((a, b) => b.score - a.score);
  }

  return scored.map((x) => x.item);
};

/** Faqat ism — bio orqali noto'g'ri match bo'lmasin */
const actorNameOnlyScore = (actor, nameQ, nameWords) => {
  const nameUz = getActorName(actor, 'uz');
  const nameRu = getActorName(actor, 'ru');
  const score = Math.max(
    nameMatchScore(nameQ, nameWords, nameUz),
    nameMatchScore(nameQ, nameWords, nameRu)
  );
  return score >= MIN_SCORE ? score : 0;
};

const resolveActorFilmHits = (actorsList, nameTokens) => {
  const tokens = ensureArray(nameTokens).filter(Boolean);
  if (!tokens.length || !actorsList?.length) return [];
  const nameQ = tokens.join(' ');
  return scoreAndSort(actorsList, (actor) => actorNameOnlyScore(actor, nameQ, tokens));
};

const rankMoviesByFacets = (moviesList, q, queryWords, facets, actorIds = null) =>
  rankItemsByYearFacets(
    moviesList,
    facets,
    (movie) => movieMatchScore(movie, q, queryWords, facets),
    getItemYear,
    {
      actorIds,
      lightFacetScoreFn: (movie) => movieFacetMatchScore(movie, facets, queryWords),
    }
  );

const rankMediaByFacets = (list, q, queryWords, artistsList, facets, facetScoreFn) =>
  rankItemsByYearFacets(list, facets, (item) =>
    mediaItemMatchScore(item, q, queryWords, artistsList, facets, facetScoreFn)
  );

const rankAlbumsByFacets = (list, q, queryWords, artistsList, facets) =>
  rankItemsByYearFacets(list, facets, (album) =>
    albumMatchScore(album, q, queryWords, artistsList, facets)
  );

/**
 * Kino type: qolgan token aktyor ismi bo'lsa — profil + biriktirilgan kinolar.
 * Topilmasa — oddiy title/facet qidiruv.
 */
const rankMovieTypeResults = (moviesList, actorsList, q, queryWords, movieFacets) => {
  const nameTokens = movieFacets.titleTokens || [];
  const actorHits = resolveActorFilmHits(actorsList, nameTokens);

  if (actorHits.length) {
    const facetsForMovies = {
      ...movieFacets,
      titleTokens: [],
      isFacetSearch: true,
    };
    return {
      actors: actorHits,
      movies: rankMoviesByFacets(
        moviesList,
        q,
        queryWords,
        facetsForMovies,
        actorHits.map((a) => a.id)
      ),
    };
  }

  return {
    actors: [],
    movies: rankMoviesByFacets(moviesList, q, queryWords, movieFacets),
  };
};

const emptyResults = () => ({
  actors: [],
  musicArtists: [],
  movies: [],
  music: [],
  albums: [],
  clips: [],
  concerts: [],
});

const emptyMeta = () => ({
  sections: Object.fromEntries(
    SEARCH_SECTIONS.map((key) => [key, { hasMore: false, nextCursor: null, total: 0 }])
  ),
});

const paginateList = (list, cursor = 0, limit = 10) => {
  const start = Math.max(0, Number(cursor) || 0);
  const size = Math.max(1, Number(limit) || 10);
  const items = ensureArray(list);
  const slice = items.slice(start, start + size);
  const next = start + slice.length;
  const hasMore = next < items.length;
  return {
    items: slice,
    hasMore,
    nextCursor: hasMore ? String(next) : null,
    total: items.length,
  };
};

/**
 * To'liq ranked natija (cache uchun). Pagination yo'q.
 */
const rankAllResults = (
  query,
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
  if (!q || q.length < MIN_QUERY_LENGTH) return emptyResults();

  const contentType = parseContentType(q);
  const queryWords = q.split(/\s+/).filter((w) => w.length >= 1);

  // Pure type + year: faqat kerakli facet parse (og'irlik past)
  if (contentType.isPureTypeSearch) {
    if (contentType.type === 'movie') {
      const movieFacets = parseMovieSearchFacets(q);
      if (movieFacets.isYearSearch) {
        return {
          ...emptyResults(),
          movies: rankMoviesByFacets(moviesList, q, queryWords, movieFacets),
        };
      }
    }
    if (contentType.type === 'music') {
      const musicFacets = parseMusicSearchFacets(q);
      if (musicFacets.isYearSearch) {
        return {
          ...emptyResults(),
          music: rankMediaByFacets(
            musicList,
            q,
            queryWords,
            musicArtistsList,
            musicFacets,
            musicFacetMatchScore
          ),
        };
      }
    }
    if (contentType.type === 'clip') {
      const clipFacets = parseClipSearchFacets(q);
      if (clipFacets.isYearSearch) {
        return {
          ...emptyResults(),
          clips: rankMediaByFacets(
            clipsList,
            q,
            queryWords,
            musicArtistsList,
            clipFacets,
            clipFacetMatchScore
          ),
        };
      }
    }
    if (contentType.type === 'concert') {
      const concertFacets = parseConcertSearchFacets(q);
      if (concertFacets.isYearSearch) {
        return {
          ...emptyResults(),
          concerts: rankMediaByFacets(
            concertsList,
            q,
            queryWords,
            musicArtistsList,
            concertFacets,
            concertFacetMatchScore
          ),
        };
      }
    }
    if (contentType.type === 'album') {
      const albumFacets = parseAlbumSearchFacets(q);
      if (albumFacets.isYearSearch) {
        return {
          ...emptyResults(),
          albums: rankAlbumsByFacets(albumsList, q, queryWords, musicArtistsList, albumFacets),
        };
      }
    }

    const pure = resolveContentTypeResults(
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
    return pure || emptyResults();
  }

  const movieFacets = parseMovieSearchFacets(q);
  const musicFacets = parseMusicSearchFacets(q);
  const clipFacets = parseClipSearchFacets(q);
  const concertFacets = parseConcertSearchFacets(q);
  const albumFacets = parseAlbumSearchFacets(q);

  const empty = emptyResults();

  if (contentType.hasTypeFilter && contentType.type) {
    if (contentType.type === 'movie') {
      const movieType = rankMovieTypeResults(
        moviesList,
        actorsList,
        q,
        queryWords,
        movieFacets
      );
      return {
        ...empty,
        actors: movieType.actors,
        movies: movieType.movies,
      };
    }
    if (contentType.type === 'music') {
      return {
        ...empty,
        music: rankMediaByFacets(
          musicList,
          q,
          queryWords,
          musicArtistsList,
          musicFacets,
          musicFacetMatchScore
        ),
      };
    }
    if (contentType.type === 'clip') {
      return {
        ...empty,
        clips: rankMediaByFacets(
          clipsList,
          q,
          queryWords,
          musicArtistsList,
          clipFacets,
          clipFacetMatchScore
        ),
      };
    }
    if (contentType.type === 'concert') {
      return {
        ...empty,
        concerts: rankMediaByFacets(
          concertsList,
          q,
          queryWords,
          musicArtistsList,
          concertFacets,
          concertFacetMatchScore
        ),
      };
    }
    if (contentType.type === 'album') {
      return {
        ...empty,
        albums: rankAlbumsByFacets(albumsList, q, queryWords, musicArtistsList, albumFacets),
      };
    }
  }

  return {
    actors: scoreAndSort(actorsList, (a) => actorMatchScore(a, q, queryWords)),
    musicArtists: scoreAndSort(musicArtistsList, (a) => musicArtistMatchScore(a, q, queryWords)),
    movies: rankMoviesByFacets(moviesList, q, queryWords, movieFacets),
    music: rankMediaByFacets(
      musicList,
      q,
      queryWords,
      musicArtistsList,
      musicFacets,
      musicFacetMatchScore
    ),
    albums: rankAlbumsByFacets(albumsList, q, queryWords, musicArtistsList, albumFacets),
    clips: rankMediaByFacets(
      clipsList,
      q,
      queryWords,
      musicArtistsList,
      clipFacets,
      clipFacetMatchScore
    ),
    concerts: rankMediaByFacets(
      concertsList,
      q,
      queryWords,
      musicArtistsList,
      concertFacets,
      concertFacetMatchScore
    ),
  };
};

/**
 * Ranked ro'yxatdan sahifa kesib olish.
 * section berilsa — faqat shu bo'lim; aks holda barcha bo'limlar (birinchi sahifa).
 */
const paginateRankedResults = (ranked, { section = null, cursor = 0, limits = DEFAULT_LIMITS } = {}) => {
  const data = emptyResults();
  const meta = emptyMeta();
  const sections = section ? [section] : SEARCH_SECTIONS;

  for (const key of sections) {
    if (!SEARCH_SECTIONS.includes(key)) continue;
    const pageLimit = limits[key] ?? DEFAULT_LIMITS[key] ?? 10;
    const page = paginateList(ranked[key] || [], cursor, pageLimit);
    data[key] = page.items;
    meta.sections[key] = {
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
      total: page.total,
    };
  }

  // Bo'lim yuklashda qolgan section meta — hasMore false
  if (section) {
    for (const key of SEARCH_SECTIONS) {
      if (key === section) continue;
      meta.sections[key] = { hasMore: false, nextCursor: null, total: (ranked[key] || []).length };
    }
  }

  return { data, meta };
};

const searchContentByQuery = (query, contentLang = 'uz', limit = 40, collections = {}, options = {}) => {
  const ranked = rankAllResults(query, collections);
  const { section = null, cursor = 0, limits = DEFAULT_LIMITS } = options;

  // Orqaga moslik: eski chaqiruvlar faqat data kutadi
  if (options.withMeta) {
    return paginateRankedResults(ranked, { section, cursor, limits });
  }

  const { data } = paginateRankedResults(ranked, {
    section,
    cursor: 0,
    limits: {
      actors: Math.min(DEFAULT_LIMITS.actors, limit),
      musicArtists: Math.min(DEFAULT_LIMITS.musicArtists, limit),
      movies: Math.min(20, limit),
      music: Math.min(DEFAULT_LIMITS.music, limit),
      albums: Math.min(DEFAULT_LIMITS.albums, limit),
      clips: Math.min(DEFAULT_LIMITS.clips, limit),
      concerts: Math.min(DEFAULT_LIMITS.concerts, limit),
    },
  });
  return data;
};

module.exports = {
  searchContentByQuery,
  rankAllResults,
  paginateRankedResults,
  parseContentType,
  normalizeText,
  DEFAULT_LIMITS,
  SEARCH_SECTIONS,
};
