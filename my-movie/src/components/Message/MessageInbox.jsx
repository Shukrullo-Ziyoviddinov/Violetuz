import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { fetchChatInbox, openChatStream } from '../../api/messagesApi';
import { unwatchPresence, watchPresence } from '../../api/presenceApi';
import UserAvatar from '../UserAvatar/UserAvatar';
import './MessageInbox.css';

const FACE_COLORS = ['#7c3aed', '#0f766e', '#ea580c', '#db2777', '#64748b', '#2563eb'];

const colorFor = (id) => {
  const raw = String(id || '');
  let sum = 0;
  for (let i = 0; i < raw.length; i += 1) sum += raw.charCodeAt(i);
  return FACE_COLORS[sum % FACE_COLORS.length];
};

const initialsOf = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const UZ_DAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

const formatWhen = (value, lang) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const start = (day) => new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const diff = Math.round((start(new Date()) - start(date)) / 86400000);
  if (diff <= 0) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  if (diff === 1) return lang === 'ru' ? 'Вчера' : 'Kecha';
  if (diff < 7) {
    if (lang === 'ru') return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    return UZ_DAYS[date.getDay()];
  }
  return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', { day: 'numeric', month: 'short' });
};

const peerIdsOf = (rows) => {
  const ids = [];
  const seen = new Set();
  for (const item of rows) {
    const id = String(item?.peer?.id || '').trim().toLowerCase();
    if (!/^[a-f0-9]{24}$/.test(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
};

const MessageInbox = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { isLoggedIn, authReady } = useAuth();
  const lang = String(i18n.language || '').startsWith('ru') ? 'ru' : 'uz';
  const [items, setItems] = useState([]);
  const [onlineIds, setOnlineIds] = useState({});
  const loadToken = useRef(0);
  const peerKey = peerIdsOf(items).join(',');

  const load = useCallback(() => {
    const token = ++loadToken.current;
    if (!isLoggedIn) {
      setItems([]);
      return Promise.resolve();
    }
    return fetchChatInbox()
      .then((data) => {
        if (token !== loadToken.current) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (token !== loadToken.current) return;
        setItems([]);
      });
  }, [isLoggedIn]);

  useEffect(() => {
    if (!authReady) return undefined;
    load();
    if (!isLoggedIn) return undefined;
    const close = openChatStream({
      onItem: () => {
        load();
      },
      onReconnect: () => {
        load();
      },
    });
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      close();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [authReady, isLoggedIn, load]);

  useEffect(() => {
    if (!authReady || !isLoggedIn || !peerKey) {
      setOnlineIds({});
      return undefined;
    }
    const ids = peerKey.split(',');
    let cancelled = false;
    ids.forEach((id) => {
      watchPresence(id)
        .then((online) => {
          if (cancelled) return;
          setOnlineIds((prev) => ({ ...prev, [id]: online === true }));
        })
        .catch(() => {
          if (cancelled) return;
          setOnlineIds((prev) => ({ ...prev, [id]: false }));
        });
    });
    const onPresence = (event) => {
      const id = String(event.detail?.userId || '').trim().toLowerCase();
      if (!ids.includes(id)) return;
      setOnlineIds((prev) => ({ ...prev, [id]: event.detail?.online === true }));
    };
    window.addEventListener('violet-presence', onPresence);
    return () => {
      cancelled = true;
      window.removeEventListener('violet-presence', onPresence);
      ids.forEach((id) => {
        unwatchPresence(id).catch(() => {});
      });
    };
  }, [authReady, isLoggedIn, peerKey]);

  if (!isLoggedIn || items.length === 0) return null;

  return (
    <ul className="message-inbox">
      {items.map((item) => {
        const name = item.peer?.name || '';
        const unread = Number(item.unread) || 0;
        return (
          <li key={item.id}>
            <button
              type="button"
              className="message-inbox-card"
              onClick={() => {
                if (!item.peer?.id) return;
                navigate(`/chats/${item.peer.id}`);
              }}
            >
              <span className="message-inbox-avatar" style={{ background: colorFor(item.peer?.id) }}>
                <UserAvatar
                  src={item.peer?.avatar}
                  className="message-inbox-avatar-img"
                  fallback={<span>{initialsOf(name)}</span>}
                />
                {unread > 0 ? (
                  <span className="message-inbox-badge">{unread > 99 ? '99+' : unread}</span>
                ) : null}
                {onlineIds[String(item.peer?.id || '').trim().toLowerCase()] ? (
                  <span className="chat-header-dot" />
                ) : null}
              </span>
              <span className="message-inbox-copy">
                <span className="message-inbox-name">{name}</span>
                <span className="message-inbox-text">{item.text}</span>
              </span>
              <span className="message-inbox-time">{formatWhen(item.createdAt, lang)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default MessageInbox;
