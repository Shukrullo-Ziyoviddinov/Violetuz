/**
 * Search service — selective Mongo load + projection + ranked cache + pagination.
 */

const Movie = require('../models/Movie.model');
const Actor = require('../models/Actor.model');
const Music = require('../models/Music.model');
const Album = require('../models/Album.model');
const Clip = require('../models/Clip.model');
const Concert = require('../models/Concert.model');
const Artist = require('../models/Artist.model');
const {
  rankAllResults,
  paginateRankedResults,
  parseContentType,
  normalizeText,
  DEFAULT_LIMITS,
  SEARCH_SECTIONS,
} = require('../utils/searchAlgorithm');
const { parseMovieSearchFacets } = require('../utils/searchFacets');
const {
  MOVIE_SEARCH_PROJECTION,
  ACTOR_SEARCH_PROJECTION,
  ARTIST_SEARCH_PROJECTION,
  MUSIC_SEARCH_PROJECTION,
  CLIP_SEARCH_PROJECTION,
  CONCERT_SEARCH_PROJECTION,
  ALBUM_SEARCH_PROJECTION,
} = require('../utils/searchProjections');
const searchCache = require('../utils/searchQueryCache');

/**
 * So'rovga qarab qaysi kolleksiyalar kerak.
 */
const resolveNeededScopes = (query, section = null) => {
  if (section && SEARCH_SECTIONS.includes(section)) {
    if (section === 'actors') return { actors: true };
    if (section === 'movies') return { movies: true };
    if (section === 'musicArtists') return { musicArtists: true };
    if (section === 'music') return { music: true, musicArtists: true };
    if (section === 'albums') return { albums: true, musicArtists: true };
    if (section === 'clips') return { clips: true, musicArtists: true };
    if (section === 'concerts') return { concerts: true, musicArtists: true };
  }

  const contentType = parseContentType(query);

  if (contentType.hasTypeFilter && contentType.type) {
    // Toza tur ("musiqalar") — artist skorlash kerak emas
    if (contentType.isPureTypeSearch) {
      if (contentType.type === 'movie') return { movies: true };
      if (contentType.type === 'music') return { music: true };
      if (contentType.type === 'clip') return { clips: true };
      if (contentType.type === 'concert') return { concerts: true };
      if (contentType.type === 'album') return { albums: true };
    }
    if (contentType.type === 'movie') {
      // "leonardo kinolari" — title token qolsa aktyor+kino kerak
      const movieFacets = parseMovieSearchFacets(query);
      const needActors = (movieFacets.titleTokens || []).length > 0;
      return needActors ? { movies: true, actors: true } : { movies: true };
    }
    if (contentType.type === 'music') return { music: true, musicArtists: true };
    if (contentType.type === 'clip') return { clips: true, musicArtists: true };
    if (contentType.type === 'concert') return { concerts: true, musicArtists: true };
    if (contentType.type === 'album') return { albums: true, musicArtists: true };
  }

  // Umumiy qidiruv — barcha scope
  return {
    actors: true,
    movies: true,
    music: true,
    albums: true,
    clips: true,
    concerts: true,
    musicArtists: true,
  };
};

const loadCollections = async (scopes = {}) => {
  const tasks = [];
  const keys = [];

  if (scopes.actors) {
    keys.push('actors');
    tasks.push(Actor.find({}, ACTOR_SEARCH_PROJECTION).lean());
  }
  if (scopes.movies) {
    keys.push('movies');
    tasks.push(Movie.find({}, MOVIE_SEARCH_PROJECTION).lean());
  }
  if (scopes.music) {
    keys.push('music');
    tasks.push(Music.find({}, MUSIC_SEARCH_PROJECTION).lean());
  }
  if (scopes.albums) {
    keys.push('albums');
    tasks.push(Album.find({}, ALBUM_SEARCH_PROJECTION).lean());
  }
  if (scopes.clips) {
    keys.push('clips');
    tasks.push(Clip.find({}, CLIP_SEARCH_PROJECTION).lean());
  }
  if (scopes.concerts) {
    keys.push('concerts');
    tasks.push(Concert.find({}, CONCERT_SEARCH_PROJECTION).lean());
  }
  if (scopes.musicArtists) {
    keys.push('musicArtists');
    tasks.push(Artist.find({}, ARTIST_SEARCH_PROJECTION).lean());
  }

  const loaded = await Promise.all(tasks);
  const collections = {
    actors: [],
    movies: [],
    music: [],
    albums: [],
    clips: [],
    concerts: [],
    musicArtists: [],
  };

  keys.forEach((key, index) => {
    collections[key] = loaded[index] || [];
  });

  return collections;
};

/**
 * Rank bir marta → cache → keyin faqat cursor slice.
 * Scroll (section+cursor) qayta Mongo load / rank qilmaydi (cache hit).
 * Year facet (`yangi` / `2024`) ham shu yo'lda — og'irlik qo'shilmaydi.
 */
const getRankedCached = async (query, lang) => {
  const q = normalizeText(query);
  const cacheKey = searchCache.makeKey(['search', 'rank', lang, q]);
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const scopes = resolveNeededScopes(query);
  const collections = await loadCollections(scopes);
  const ranked = rankAllResults(query, collections);
  searchCache.set(cacheKey, ranked);
  return ranked;
};

/**
 * @param {string} query
 * @param {string} contentLang
 * @param {{ section?: string|null, cursor?: number|string, limit?: number }} options
 */
const searchAll = async (query, contentLang = 'uz', options = {}) => {
  const section = options.section && SEARCH_SECTIONS.includes(options.section) ? options.section : null;
  const cursor = Math.max(0, Number(options.cursor) || 0);
  const pageLimit = options.limit != null ? Math.max(1, Math.min(40, Number(options.limit))) : null;

  const ranked = await getRankedCached(query, contentLang);

  const limits = { ...DEFAULT_LIMITS };
  if (pageLimit != null) {
    for (const key of SEARCH_SECTIONS) {
      limits[key] = pageLimit;
    }
  }

  // Section load-more: faqat shu bo'limdan cursor dan boshlab
  if (section) {
    return paginateRankedResults(ranked, {
      section,
      cursor,
      limits,
    });
  }

  // Birinchi sahifa: har bo'lim 0 dan
  return paginateRankedResults(ranked, {
    section: null,
    cursor: 0,
    limits,
  });
};

module.exports = {
  searchAll,
  resolveNeededScopes,
  loadCollections,
  DEFAULT_LIMITS,
  SEARCH_SECTIONS,
};
