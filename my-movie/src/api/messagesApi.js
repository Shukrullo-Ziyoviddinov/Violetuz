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

export const sendChatMessage = async (userId, text, replyTo = null, animationId = '', gif = '', video = null) => {
  const id = String(animationId || '').trim();
  const gifFile = String(gif || '').trim();
  const videoUrl = String(video?.url || '').trim();
  const response = await fetch(`${API_BASE_URL}/messages/with/${encodeURIComponent(userId)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      ...(id ? { animationId: id, animated: true } : {}),
      ...(gifFile ? { gif: gifFile } : {}),
      ...(videoUrl ? {
        video: {
          url: videoUrl,
          duration: Number(video.duration) || 0,
          start: Number(video.start) || 0,
          viewOnce: video.viewOnce === true,
          ...(video.poster ? { poster: String(video.poster) } : {}),
        },
      } : {}),
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

export const editChatMessage = async (messageId, text, quoteText) => {
  const response = await fetch(`${API_BASE_URL}/messages/${encodeURIComponent(messageId)}/edit`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      ...(typeof quoteText === 'string' ? { quoteText } : {}),
    }),
  });
  return parseJson(response);
};

export const viewChatVideo = async (messageId) => {
  const response = await fetch(`${API_BASE_URL}/messages/${encodeURIComponent(messageId)}/view`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return parseJson(response);
};

export const deleteChatMessage = async (messageId, forPeer = false) => {
  const response = await fetch(`${API_BASE_URL}/messages/${encodeURIComponent(messageId)}/hide`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ forPeer: forPeer === true }),
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

export const pinChatMessage = async (messageId, forPeer = false) => {
  const response = await fetch(`${API_BASE_URL}/messages/${encodeURIComponent(messageId)}/pin`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ forPeer: forPeer === true }),
  });
  return parseJson(response);
};

export const unpinChatMessage = async (messageId) => {
  const response = await fetch(`${API_BASE_URL}/messages/${encodeURIComponent(messageId)}/unpin`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return parseJson(response);
};

export const reactChatMessage = async (messageId, emoji, emojiId = '') => {
  const response = await fetch(`${API_BASE_URL}/messages/${encodeURIComponent(messageId)}/react`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emoji: String(emoji || ''),
      ...(emojiId ? { emojiId: String(emojiId) } : {}),
    }),
  });
  return parseJson(response);
};

export const openChatStream = ({ onItem, onTyping, onRead, onDelete, onEdit, onPin, onReact, onReconnect }) => {
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
  source.addEventListener('edit', (event) => {
    try {
      const item = JSON.parse(event.data);
      if (item?.id) onEdit?.(item);
    } catch {
      // Buzilgan qator tushib qoladi, ulanish ochiq qoladi.
    }
  });
  source.addEventListener('pin', (event) => {
    try {
      const item = JSON.parse(event.data);
      if (item?.id) onPin?.(item);
    } catch {
      // Buzilgan qator tushib qoladi, ulanish ochiq qoladi.
    }
  });
  source.addEventListener('react', (event) => {
    try {
      const item = JSON.parse(event.data);
      if (item?.id) onReact?.(item);
    } catch {
      // Buzilgan qator tushib qoladi, ulanish ochiq qoladi.
    }
  });
  source.addEventListener('delete', (event) => {
    try {
      const item = JSON.parse(event.data);
      if (item?.id) onDelete?.(item);
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
