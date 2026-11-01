import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isChannelLike = (item) =>
  item &&
  typeof item === 'object' &&
  typeof item.id === 'string' &&
  typeof item.name === 'string';

export const normalizeChannelsPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isChannelLike);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Channels API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllChannels = async () => {
  const data = await fetchJson(`${API_BASE_URL}/channels`);
  return normalizeChannelsPayload(data);
};

export const fetchChannelById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/channels/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Channels API error: ${res.status}`);
  }
  const data = await res.json();
  return isChannelLike(data?.data) ? data.data : null;
};
