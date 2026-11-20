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
    const err = new Error(body?.message || 'Message request failed');
    err.status = response.status;
    throw err;
  }
  return body?.data ?? body;
};

export const fetchMessageSelf = async () => {
  const response = await fetch(`${API_BASE_URL}/messages/me`, {
    credentials: 'include',
  });
  return parseJson(response);
};

export const fetchChatInbox = async () => {
  const response = await fetch(`${API_BASE_URL}/messages/inbox`, {
    credentials: 'include',
  });
  return parseJson(response);
};

export const sendChatMessage = async (userId, text, replyTo = null, animated = false) => {
  const response = await fetch(`${API_BASE_URL}/messages/with/${encodeURIComponent(userId)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      ...(animated ? { animated: true } : {}),
      ...(replyTo?.id ? { replyTo: { id: String(replyTo.id) } } : {}),
    }),
  });
  return parseJson(response);
};

export const fetchChatBackgrounds = async () => {
  const response = await fetch(`${API_BASE_URL}/messages/backgrounds`, {
    credentials: 'include',
  });
  return parseJson(response);
};

export const fetchMyChatBackground = async () => {
  const response = await fetch(`${API_BASE_URL}/messages/background`, {
    credentials: 'include',
  });
  return parseJson(response);
};

export const saveChatBackground = async (backgroundId) => {
  const response = await fetch(`${API_BASE_URL}/messages/background`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ backgroundId }),
  });
  return parseJson(response);
};

export const fetchChatThread = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/messages/with/${encodeURIComponent(userId)}`, {
    credentials: 'include',
  });
  return parseJson(response);
};

export const signalChatTyping = async (userId, typing) => {
  const response = await fetch(`${API_BASE_URL}/messages/with/${encodeURIComponent(userId)}/typing`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ typing: typing === true }),
  });
  return parseJson(response);
};

export const openChatStream = ({ onItem, onTyping, onRead, onReconnect }) => {
  const source = new EventSource(`${API_BASE_URL}/messages/stream`, { withCredentials: true });
  source.onopen = () => {
    onReconnect?.();
  };
  source.addEventListener('chat', (event) => {
    try {
      const item = JSON.parse(event.data);
      if (item?.id) onItem?.(item);
    } catch {
      // Buzilgan qator tushib qoladi, ulanish ochiq qoladi.
    }
  });
  source.addEventListener('typing', (event) => {
    try {
      const item = JSON.parse(event.data);
      if (item?.userId) onTyping?.(item);
    } catch {
      // Buzilgan qator tushib qoladi, ulanish ochiq qoladi.
    }
  });
  source.addEventListener('read', (event) => {
    try {
      const item = JSON.parse(event.data);
      if (item?.userId && item?.readAt) onRead?.(item);
    } catch {
      // Buzilgan qator tushib qoladi, ulanish ochiq qoladi.
    }
  });
  return () => source.close();
};
