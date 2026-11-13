import { resolveApiBaseUrl } from './apiBase';

const API_BASE_URL = resolveApiBaseUrl();

const notificationsFetch = (path, options = {}) =>
  fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

const parseJson = async (response) => {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok || body?.success === false) {
    const err = new Error(body?.message || 'Notification request failed');
    err.status = response.status;
    throw err;
  }
  return body?.data ?? body;
};

export const fetchNotificationSettings = async () => {
  const res = await notificationsFetch('/notifications/settings');
  return parseJson(res);
};

export const fetchNotifications = async () => {
  const res = await notificationsFetch('/notifications');
  return parseJson(res);
};

export const fetchUnreadCount = async () => {
  const res = await notificationsFetch('/notifications/unread-count');
  return parseJson(res);
};

export const openNotificationStream = ({ onItem, onReconnect }) => {
  const source = new EventSource(`${API_BASE_URL}/notifications/stream`, { withCredentials: true });
  let opened = false;
  source.onopen = () => {
    if (opened) onReconnect?.();
    opened = true;
  };
  source.addEventListener('notification', (event) => {
    try {
      const item = JSON.parse(event.data);
      if (item?.id) onItem?.(item);
    } catch {
      // Buzilgan qator tushib qoladi, ulanish ochiq qoladi.
    }
  });
  return () => source.close();
};

export const markNotificationsRead = async (ids) => {
  const res = await notificationsFetch('/notifications/read', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
  return parseJson(res);
};

export const fetchPushPublicKey = async () => {
  const res = await notificationsFetch('/notifications/push-key');
  return parseJson(res);
};

export const saveNotificationDevice = async (subscription) => {
  const res = await notificationsFetch('/notifications/devices', {
    method: 'POST',
    body: JSON.stringify(subscription),
  });
  return parseJson(res);
};

export const saveNotificationSettings = async ({ subscribers }) => {
  const res = await notificationsFetch('/notifications/settings', {
    method: 'PUT',
    body: JSON.stringify({ subscribers }),
  });
  return parseJson(res);
};
