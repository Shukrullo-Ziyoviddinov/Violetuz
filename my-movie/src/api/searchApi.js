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

export const fetchSearchResults = async (query, lang = 'uz') => {
  const trimmed = String(query || '').trim();
  if (!trimmed) return EMPTY_RESULTS;

  const params = new URLSearchParams({ q: trimmed, lang });
  const res = await fetch(`${API_BASE_URL}/search?${params.toString()}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Search API error: ${res.status}`);
  }

  const json = await res.json();
  return json?.data ?? EMPTY_RESULTS;
};
