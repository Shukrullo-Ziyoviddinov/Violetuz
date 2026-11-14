import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { fetchChatThread, openChatStream, sendChatMessage } from '../../../api/messagesApi';
import ChatHeader from './ChatHeader';
import ChatThread from './ChatThread';
import ChatComposer from './ChatComposer';
import './Chat.css';

const sameId = (left, right) => String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();

const Chat = ({ userId }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { isLoggedIn, authReady, profile } = useAuth();
  const lang = String(i18n.language || '').startsWith('ru') ? 'ru' : 'uz';
  const [peer, setPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [ready, setReady] = useState(false);
  const loadToken = useRef(0);

  const load = useCallback(() => {
    const token = ++loadToken.current;
    if (!userId) return Promise.resolve({ stale: true });
    return fetchChatThread(userId).then(
      (data) => {
        const stale = token !== loadToken.current;
        if (!stale) {
          setPeer(data?.peer || null);
          setMessages(Array.isArray(data?.messages) ? data.messages : []);
        }
        return { stale };
      },
      (err) => {
        err.stale = token !== loadToken.current;
        throw err;
      }
    );
  }, [userId]);

  useEffect(() => {
    if (!authReady) return undefined;
    if (!isLoggedIn) {
      setPeer(null);
      setMessages([]);
      setReady(true);
      return undefined;
    }
    let cancelled = false;
    setReady(false);
    load()
      .catch((err) => {
        if (cancelled || err?.stale) return;
        setPeer(null);
        setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, isLoggedIn, load]);

  useEffect(() => {
    if (!authReady || !isLoggedIn || !userId) return undefined;
    let closed = false;
    const close = openChatStream({
      onItem: (item) => {
        if (closed || !item?.id) return;
        const fromPeer = sameId(item.senderId, userId);
        const toPeer = sameId(item.recipientId, userId);
        if (!fromPeer && !toPeer) return;
        if (fromPeer) {
          load().catch(() => {
            if (closed) return;
            setMessages((current) => (
              current.some((row) => row.id === item.id) ? current : [...current, item]
            ));
          });
          return;
        }
        setMessages((current) => (
          current.some((row) => row.id === item.id) ? current : [...current, item]
        ));
      },
      onReconnect: () => {
        if (!closed) load().catch(() => {});
      },
    });
    const onVisible = () => {
      if (document.visibilityState === 'visible') load().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      closed = true;
      close();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [authReady, isLoggedIn, load, userId]);

  const notice = !authReady || !ready
    ? ''
    : !isLoggedIn
      ? (lang === 'ru' ? 'Войдите, чтобы открыть чат' : 'Suhbatni ochish uchun hisobingizga kiring')
      : !peer
        ? (lang === 'ru' ? 'Чат не открылся' : 'Suhbat ochilmadi')
        : '';

  return (
    <section className="chat" aria-label={peer?.name || (lang === 'ru' ? 'Чат' : 'Suhbat')}>
      <ChatHeader
        lang={lang}
        peer={peer ? { ...peer, onlineLabel: lang === 'ru' ? 'в сети' : 'onlayn' } : null}
        onBack={() => navigate(-1)}
      />
      <ChatThread messages={messages} selfId={profile?.id} notice={notice} />
      <ChatComposer
        lang={lang}
        disabled={!isLoggedIn || !peer}
        onSend={async (text) => {
          const saved = await sendChatMessage(userId, text);
          if (!saved?.id) return;
          setMessages((current) => (
            current.some((row) => row.id === saved.id) ? current : [...current, saved]
          ));
        }}
      />
    </section>
  );
};

export default Chat;
