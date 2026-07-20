import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isArtistMusicStoryLike = (item) =>
  item &&
  typeof item === 'object' &&
  item.id != null &&
  typeof item.artistId === 'string' &&
  typeof item.title === 'string' &&
  item.artistMusicId != null;

export const normalizeArtistMusicStoriesPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isArtistMusicStoryLike);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Artist music stories API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllArtistMusicStories = async () => {
  const data = await fetchJson(`${API_BASE_URL}/artist-music-stories`);
  return normalizeArtistMusicStoriesPayload(data);
};

export const fetchArtistMusicStoriesByArtist = async (artistId) => {
  const data = await fetchJson(
    `${API_BASE_URL}/artist-music-stories/artist/${encodeURIComponent(artistId)}`
  );
  return normalizeArtistMusicStoriesPayload(data);
};

export const fetchArtistMusicStoryById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/artist-music-stories/${id}`);
  return isArtistMusicStoryLike(data?.data) ? data.data : null;
};
