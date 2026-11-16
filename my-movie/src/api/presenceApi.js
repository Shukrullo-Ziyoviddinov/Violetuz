import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const parseJson = async (response) => {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok || body?.success === false) {
    const err = new Error(body?.message || 'Presence request failed');
    err.status = response.status;
    throw err;
  }
  return body?.data ?? body;
};

export const watchPresence = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/presence/${encodeURIComponent(userId)}`, {
    credentials: 'include',
  });
  const data = await parseJson(response);
  return data?.online === true;
};

export const unwatchPresence = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/presence/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return parseJson(response);
};

export const openPresenceStream = ({ onChange }) => {
  const source = new EventSource(`${API_BASE_URL}/presence/stream`, { withCredentials: true });
  source.addEventListener('presence', (event) => {
    try {
      const item = JSON.parse(event.data);
      if (item?.userId) onChange?.(item);
    } catch {
      // Buzilgan qator tushib qoladi, ulanish ochiq qoladi.
    }
  });
  return () => source.close();
};
