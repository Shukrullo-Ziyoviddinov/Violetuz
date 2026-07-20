import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

export const isActorPageLabelLike = (item) =>
  item &&
  typeof item === 'object' &&
  typeof item.id === 'string' &&
  item.title != null;

export const normalizeActorPageLabelsPayload = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return list.filter(isActorPageLabelLike);
};

/** Array → { awards: {uz,ru}, ... } — eski frontend formatiga mos */
export const toActorPageSectionLabelsMap = (list = []) => {
  const map = {};
  for (const item of Array.isArray(list) ? list : []) {
    if (!item?.id) continue;
    map[item.id] = item.title || { uz: '', ru: '' };
  }
  return map;
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Actor page labels API error: ${res.status}`);
  }
  return res.json();
};

export const fetchAllActorPageLabels = async () => {
  const data = await fetchJson(`${API_BASE_URL}/actor-page-labels`);
  return normalizeActorPageLabelsPayload(data);
};

export const fetchActorPageLabelById = async (id) => {
  const data = await fetchJson(`${API_BASE_URL}/actor-page-labels/${encodeURIComponent(id)}`);
  return isActorPageLabelLike(data?.data) ? data.data : null;
};
