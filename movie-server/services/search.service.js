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
const User = require('../models/User.model');
const Channel = require('../models/Channel.model');
const {
  rankAllResults,
  paginateRankedResults,
  parseContentType,
  normalizeText,
  DEFAULT_LIMITS,
  SEARCH_SECTIONS,
} = require('../utils/searchAlgorithm');
const {
  MIN_QUERY_LENGTH: IDENTITY_MIN_QUERY_LENGTH,
  normalizeIdentityQuery,
  rankIdentityUsernames,
} = require('../utils/searchIdentity');
const { getContentTypes } = require('../utils/searchContentType');
const { parseMovieSearchFacets } = require('../utils/searchFacets');
const {
  MOVIE_SEARCH_PROJECTION,
  ACTOR_SEARCH_PROJECTION,
  ARTIST_SEARCH_PROJECTION,
  MUSIC_SEARCH_PROJECTION,
  CLIP_SEARCH_PROJECTION,
  CONCERT_SEARCH_PROJECTION,
  ALBUM_SEARCH_PROJECTION,
  USER_SEARCH_PROJECTION,
  CHANNEL_SEARCH_PROJECTION,
} = require('../utils/searchProjections');
const searchCache = require('../utils/searchQueryCache');
const { attachSearchShorts } = require('./searchShortsAttach.service');

const IDENTITY_SECTIONS = ['people', 'channels'];
const IDENTITY_LIMITS = {
  people: 8,
  channels: 8,
};

/** Tur filtri («kino», «musiqa», «klip») va juda qisqa so'rovda odam/kanal qo'shilmaydi. */
const shouldAttachIdentity = (query) =>
  !parseContentType(query).hasTypeFilter &&
  normalizeIdentityQuery(query).length >= IDENTITY_MIN_QUERY_LENGTH;

const toSearchUser = (user) => ({
  id: String(user?._id || ''),
  username: user?.username || '',
  usernameNormalized: user?.usernameNormalized || '',
  name: user?.name || '',
  avatar: user?.avatar || '',
});

const toSearchChannel = (channel) => ({
  id: channel?.id,
  username: channel?.username || '',
  usernameNormalized: channel?.usernameNormalized || '',
  name: channel?.name || '',
  avatar: channel?.avatar || '',
});

const loadIdentityCollections = async () => {
  const [users, channels] = await Promise.all([
    User.find({}, USER_SEARCH_PROJECTION).lean(),
    Channel.find({}, CHANNEL_SEARCH_PROJECTION).lean(),
  ]);
  return {
    people: (users || []).map(toSearchUser),
    channels: (channels || []).map(toSearchChannel),
  };
};

const attachIdentityRank = async (ranked, query) => {
  const { people, channels } = await loadIdentityCollections();
  const peopleRank = rankIdentityUsernames(people, query);
  const channelsRank = rankIdentityUsernames(channels, query);
  return {
    ...ranked,
    people: peopleRank.items,
    channels: channelsRank.items,
    identityTopScores: {
      people: peopleRank.topScore,
      channels: channelsRank.topScore,
    },
  };
};

const sliceIdentityList = (list, cursor, limit) => {
  const start = Math.max(0, Number(cursor) || 0);
  const size = Math.max(1, Number(limit) || IDENTITY_LIMITS.people);
  const items = Array.isArray(list) ? list : [];
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
 * Odam va kanal sahifasini mavjud javob yoniga qo'yadi.
 * identityTopScores yo'q bo'lsa javob o'zgarmaydi.
 */
const applyIdentityToPage = (page, ranked, { section = null, cursor = 0, limits = IDENTITY_LIMITS } = {}) => {
  if (!ranked?.identityTopScores) return page;

  const keys = section && IDENTITY_SECTIONS.includes(section) ? [section] : IDENTITY_SECTIONS;
  if (!page.data) page.data = {};
  if (!page.meta) page.meta = {};
  if (!page.meta.sections) page.meta.sections = {};

  for (const key of keys) {
    const sliced = sliceIdentityList(ranked[key], section ? cursor : 0, limits[key]);
    page.data[key] = sliced.items;
    page.meta.sections[key] = {
      hasMore: sliced.hasMore,
      nextCursor: sliced.nextCursor,
      total: sliced.total,
      topScore: ranked.identityTopScores[key] ?? 0,
    };
  }

  if (section && IDENTITY_SECTIONS.includes(section)) {
    const other = section === 'people' ? 'channels' : 'people';
    page.meta.sections[other] = {
      hasMore: false,
      nextCursor: null,
      total: (ranked[other] || []).length,
      topScore: ranked.identityTopScores[other] ?? 0,
    };
  }

  return page;
};

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
  const types = getContentTypes(contentType);

  if (contentType.hasTypeFilter && types.length) {
    const scopes = {};

    if (contentType.isPureTypeSearch) {
      for (const t of types) {
        if (t === 'movie') scopes.movies = true;
        if (t === 'music') scopes.music = true;
        if (t === 'clip') scopes.clips = true;
        if (t === 'concert') scopes.concerts = true;
        if (t === 'album') scopes.albums = true;
      }
      return scopes;
    }

    for (const t of types) {
      if (t === 'movie') {
        const movieFacets = parseMovieSearchFacets(query);
        scopes.movies = true;
        if ((movieFacets.titleTokens || []).length > 0) scopes.actors = true;
      }
      if (t === 'music') {
        scopes.music = true;
        scopes.musicArtists = true;
      }
      if (t === 'clip') {
        scopes.clips = true;
        scopes.musicArtists = true;
      }
      if (t === 'concert') {
        scopes.concerts = true;
        scopes.musicArtists = true;
      }
      if (t === 'album') {
        scopes.albums = true;
        scopes.musicArtists = true;
      }
    }
    return scopes;
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
  let ranked = rankAllResults(query, collections);
  if (shouldAttachIdentity(query)) {
    ranked = await attachIdentityRank(ranked, query);
  }
  searchCache.set(cacheKey, ranked);
  return ranked;
};

const CHANNEL_TYPES = new Set(['all', 'movies', 'videos', 'shorts', 'playlists', 'posts']);

const emptyChannelCollections = () => ({
  actors: [],
  movies: [],
  music: [],
  albums: [],
  clips: [],
  concerts: [],
  musicArtists: [],
});

/**
 * Kanal qidiruvi — shu rankAllResults. Kolleksiya oldindan channelId bo'yicha kesiladi.
 * Navbar keshiga va umumiy rank yo'liga yozilmaydi.
 */
const searchChannel = async (query, _contentLang, options) => {
  const channelId = String(options.channelId || '').trim();
  const channelType = CHANNEL_TYPES.has(options.channelType) ? options.channelType : 'all';
  const wantMovies = channelType === 'all' || channelType === 'movies';
  const wantMusic = channelType === 'all';
  const wantShorts = channelType === 'all' || channelType === 'shorts';
  const rankParents = channelType === 'shorts';
  const loadMovies = wantMovies || rankParents;
  const loadMusic = wantMusic || rankParents;
  const loadClips = wantMusic || rankParents;
  const loadConcerts = wantMusic || rankParents;
  const hasCatalog = loadMovies || loadMusic || loadClips || loadConcerts;

  const [movies, music, clips, concerts] = hasCatalog
    ? await Promise.all([
      loadMovies ? Movie.find({ channelId }, MOVIE_SEARCH_PROJECTION).lean() : [],
      loadMusic ? Music.find({ channelId }, MUSIC_SEARCH_PROJECTION).lean() : [],
      loadClips ? Clip.find({ channelId }, CLIP_SEARCH_PROJECTION).lean() : [],
      loadConcerts ? Concert.find({ channelId }, CONCERT_SEARCH_PROJECTION).lean() : [],
    ])
    : [[], [], [], []];

  const ranked = rankAllResults(query, {
    ...emptyChannelCollections(),
    movies,
    music,
    clips,
    concerts,
  });
  const page = paginateRankedResults(ranked, {
    section: null,
    cursor: 0,
    limits: DEFAULT_LIMITS,
  });

  if (!wantMovies) page.data.movies = [];
  if (!wantMusic) {
    page.data.music = [];
    page.data.clips = [];
    page.data.concerts = [];
    page.data.albums = [];
  }

  page.data.shorts = wantShorts ? await attachSearchShorts(query, ranked, channelId) : [];
  return page;
};

/**
 * @param {string} query
 * @param {string} contentLang
 * @param {{ section?: string|null, cursor?: number|string, limit?: number, channelId?: string|null, channelType?: string|null }} options
 */
const searchAll = async (query, contentLang = 'uz', options = {}) => {
  const channelId = String(options.channelId || '').trim();
  if (channelId) {
    return searchChannel(query, contentLang, { ...options, channelId });
  }

  const cursor = Math.max(0, Number(options.cursor) || 0);
  const pageLimit = options.limit != null ? Math.max(1, Math.min(40, Number(options.limit))) : null;

  const ranked = await getRankedCached(query, contentLang);
  const identitySection = IDENTITY_SECTIONS.includes(options.section) && ranked.identityTopScores
    ? options.section
    : null;
  const section = !identitySection && options.section && SEARCH_SECTIONS.includes(options.section)
    ? options.section
    : null;

  const limits = { ...DEFAULT_LIMITS, ...IDENTITY_LIMITS };
  if (pageLimit != null) {
    for (const key of [...SEARCH_SECTIONS, ...IDENTITY_SECTIONS]) {
      limits[key] = pageLimit;
    }
  }

  // Katalog bo'limi: odam/kanal qo'shilmaydi, eski sahifa shakli qoladi.
  if (section) {
    return paginateRankedResults(ranked, {
      section,
      cursor,
      limits,
    });
  }

  if (identitySection) {
    const identityPage = paginateRankedResults(ranked, {
      section: identitySection,
      cursor: 0,
      limits,
    });
    return applyIdentityToPage(identityPage, ranked, {
      section: identitySection,
      cursor,
      limits,
    });
  }

  const page = paginateRankedResults(ranked, {
    section: null,
    cursor: 0,
    limits,
  });
  page.data.shorts = await attachSearchShorts(query, ranked);
  return applyIdentityToPage(page, ranked, { section: null, cursor: 0, limits });
};

module.exports = {
  searchAll,
  resolveNeededScopes,
  loadCollections,
  shouldAttachIdentity,
  applyIdentityToPage,
  DEFAULT_LIMITS,
  SEARCH_SECTIONS,
};
