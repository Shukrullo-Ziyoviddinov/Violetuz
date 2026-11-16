import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();
const wanted = new Map();

const keyOf = (userId) => String(userId || '').trim().toLowerCase();

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

const requestPresence = async (userId, method) => {
  const response = await fetch(`${API_BASE_URL}/presence/${encodeURIComponent(userId)}`, {
    method,
    credentials: 'include',
  });
  const data = await parseJson(response);
  return data?.online === true;
};

export const watchPresence = async (userId) => {
  const id = keyOf(userId);
  wanted.set(id, (wanted.get(id) || 0) + 1);
  try {
    return await requestPresence(id, 'GET');
  } catch (err) {
    const left = (wanted.get(id) || 1) - 1;
    if (left > 0) wanted.set(id, left);
    else wanted.delete(id);
    throw err;
  }
};

export const unwatchPresence = async (userId) => {
  const id = keyOf(userId);
  const left = (wanted.get(id) || 0) - 1;
  if (left > 0) {
    wanted.set(id, left);
    return;
  }
  wanted.delete(id);
  await requestPresence(id, 'DELETE');
  if ((wanted.get(id) || 0) > 0) {
    try {
      await requestPresence(id, 'GET');
    } catch {
      // Ro'yxatdan chatga o'tishda keyingi kuzatuv qayta so'raydi.
    }
  }
};

export const openPresenceStream = ({ onChange }) => {
  let source = null;
  let stopped = false;
  let retryTimer = 0;

  const onPresence = (event) => {
    try {
      const item = JSON.parse(event.data);
      if (item?.userId) onChange?.(item);
    } catch {
      // Buzilgan qator tushib qoladi, ulanish ochiq qoladi.
    }
  };

  const connect = () => {
    if (stopped) return;
    window.clearTimeout(retryTimer);
    source = new EventSource(`${API_BASE_URL}/presence/stream`, { withCredentials: true });
    source.addEventListener('presence', onPresence);
    source.onerror = () => {
      if (stopped || !source || source.readyState !== EventSource.CLOSED) return;
      source.removeEventListener('presence', onPresence);
      source.close();
      source = null;
      retryTimer = window.setTimeout(connect, 1000);
    };
  };

  connect();

  return () => {
    stopped = true;
    window.clearTimeout(retryTimer);
    if (!source) return;
    source.removeEventListener('presence', onPresence);
    source.close();
    source = null;
  };
};
