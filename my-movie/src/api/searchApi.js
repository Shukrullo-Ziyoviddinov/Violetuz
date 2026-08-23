import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const EMPTY_RESULTS = {
  actors: [],
  musicArtists: [],
  movies: [],
  music: [],
  albums: [],
  clips: [],
  concerts: [],
};

const EMPTY_SECTION_META = {
  hasMore: false,
  nextCursor: null,
  total: 0,
};

const EMPTY_META = {
  sections: {
    actors: { ...EMPTY_SECTION_META },
    musicArtists: { ...EMPTY_SECTION_META },
    movies: { ...EMPTY_SECTION_META },
    music: { ...EMPTY_SECTION_META },
    albums: { ...EMPTY_SECTION_META },
    clips: { ...EMPTY_SECTION_META },
    concerts: { ...EMPTY_SECTION_META },
  },
};

const cloneEmptyMetaSections = () => ({
  actors: { ...EMPTY_SECTION_META },
  musicArtists: { ...EMPTY_SECTION_META },
  movies: { ...EMPTY_SECTION_META },
  music: { ...EMPTY_SECTION_META },
  albums: { ...EMPTY_SECTION_META },
  clips: { ...EMPTY_SECTION_META },
  concerts: { ...EMPTY_SECTION_META },
});

export const fetchSearchResults = async (query, lang = 'uz', options = {}) => {
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    return { ...EMPTY_RESULTS, meta: EMPTY_META };
  }

  const params = new URLSearchParams({ q: trimmed, lang });
  if (options.section) params.set('section', options.section);
  if (options.cursor != null && options.cursor !== '') {
    params.set('cursor', String(options.cursor));
  }
  if (options.limit != null) params.set('limit', String(options.limit));

  const res = await fetch(`${API_BASE_URL}/search?${params.toString()}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Search API error: ${res.status}`);
  }

  const json = await res.json();
  return {
    ...(json?.data ?? EMPTY_RESULTS),
    meta: json?.meta ?? EMPTY_META,
  };
};

export { EMPTY_RESULTS, EMPTY_META, cloneEmptyMetaSections };
