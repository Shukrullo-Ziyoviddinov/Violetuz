import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const EMPTY_SITE_LINKS = {
  id: 'site',
  contact: {},
  socialLinks: {},
  appStoreLinks: {},
};

export const isSiteLinksLike = (item) =>
  item &&
  typeof item === 'object' &&
  typeof item.contact === 'object' &&
  typeof item.socialLinks === 'object' &&
  typeof item.appStoreLinks === 'object';

export const normalizeSiteLinksPayload = (payload) => {
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  if (!isSiteLinksLike(data)) return { ...EMPTY_SITE_LINKS };
  return {
    id: data.id || 'site',
    contact: data.contact || {},
    socialLinks: data.socialLinks || {},
    appStoreLinks: data.appStoreLinks || {},
  };
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Site links API error: ${res.status}`);
  }
  return res.json();
};

export const fetchSiteLinks = async () => {
  const data = await fetchJson(`${API_BASE_URL}/site-links`);
  return normalizeSiteLinksPayload(data);
};

export const fetchContactData = async () => {
  const data = await fetchJson(`${API_BASE_URL}/site-links/contact`);
  return data?.data && typeof data.data === 'object' ? data.data : {};
};

export const fetchSocialLinks = async () => {
  const data = await fetchJson(`${API_BASE_URL}/site-links/social`);
  return data?.data && typeof data.data === 'object' ? data.data : {};
};

export const fetchAppStoreLinks = async () => {
  const data = await fetchJson(`${API_BASE_URL}/site-links/app-store`);
  return data?.data && typeof data.data === 'object' ? data.data : {};
};
