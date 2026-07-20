import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isVideoBannerLike = (item) =>
  item &&
  typeof item === 'object' &&
  item.id != null &&
  (item.type === 'movie' || item.type === 'music') &&
  item.refId != null &&
  typeof item.video === 'string';

export const normalizeVideoBannersPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isVideoBannerLike);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Video banners API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllVideoBanners = async () => {
  const data = await fetchJson(`${API_BASE_URL}/video-banners`);
  return normalizeVideoBannersPayload(data);
};

export const fetchVideoBannersByType = async (type) => {
  const data = await fetchJson(`${API_BASE_URL}/video-banners/type/${encodeURIComponent(type)}`);
  return normalizeVideoBannersPayload(data);
};

export const fetchVideoBannerById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/video-banners/${id}`);
  return isVideoBannerLike(data?.data) ? data.data : null;
};
