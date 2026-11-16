import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { fetchChatThread, fetchMyChatBackground, openChatStream, sendChatMessage, signalChatTyping } from '../../../api/messagesApi';
import { getDominantColor } from '../../../utils/dominantColor';
import { bubbleVars, readBubbleChoice } from './chatBubbles';
import { readTextChoice, textLookClass, textVars } from './chatTextFont';
import ChatHeader from './ChatHeader';
import ChatThread from './ChatThread';
import ChatComposer from './ChatComposer';
import './Chat.css';

const DEFAULT_CHAT_BG = '/img/chat-backgrounds/chat-bg-1.jpg';
const HEADER_FALLBACK = { r: 20, g: 16, b: 31 };
const HEADER_ALPHA = 0.8;
const HEADER_SHADOW_ALPHA = 0.34;

const sameId = (left, right) => String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();

const Chat = ({ userId }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { isLoggedIn, authReady, profile } = useAuth();
  const lang = String(i18n.language || '').startsWith('ru') ? 'ru' : 'uz';
  const [peer, setPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [ready, setReady] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(DEFAULT_CHAT_BG);
  const [headerColor, setHeaderColor] = useState(null);
  const [bubbles, setBubbles] = useState(readBubbleChoice);
  const [textChoice, setTextChoice] = useState(readTextChoice);
  const [peerTyping, setPeerTyping] = useState(false);
  const loadToken = useRef(0);
  const typingIdleRef = useRef(null);
  const typingSentRef = useRef(false);
  const typingPingRef = useRef(0);

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
    if (!authReady) return undefined;
    if (!isLoggedIn) {
      setBackgroundImage(DEFAULT_CHAT_BG);
      return undefined;
    }
    let cancelled = false;
    fetchMyChatBackground()
      .then((choice) => {
        if (!cancelled) setBackgroundImage(choice?.image || DEFAULT_CHAT_BG);
      })
      .catch(() => {
        if (!cancelled) setBackgroundImage(DEFAULT_CHAT_BG);
      });
    const onSaved = (event) => {
      const image = event.detail?.image;
      if (image) setBackgroundImage(image);
    };
    window.addEventListener('violet-chat-background', onSaved);
    return () => {
      cancelled = true;
      window.removeEventListener('violet-chat-background', onSaved);
    };
  }, [authReady, isLoggedIn]);

  useEffect(() => {
    if (!backgroundImage) return undefined;
    let cancelled = false;
    const imgSrc = backgroundImage.startsWith('http')
      ? backgroundImage
      : `${window.location.origin}${backgroundImage.startsWith('/') ? backgroundImage : `/${backgroundImage}`}`;
    getDominantColor(imgSrc).then((color) => {
      if (!cancelled && color) setHeaderColor(color);
    });
    return () => {
      cancelled = true;
    };
  }, [backgroundImage]);

  useEffect(() => {
    const onBubbles = (event) => {
      if (event.detail?.outgoing && event.detail?.incoming) setBubbles(event.detail);
    };
    window.addEventListener('violet-chat-bubbles', onBubbles);
    return () => window.removeEventListener('violet-chat-bubbles', onBubbles);
  }, []);

  useEffect(() => {
    const onText = (event) => {
      if (event.detail?.color) setTextChoice(event.detail);
    };
    window.addEventListener('violet-chat-text', onText);
    return () => window.removeEventListener('violet-chat-text', onText);
  }, []);

  useEffect(() => {
    if (!authReady || !isLoggedIn || !userId) return undefined;
    let closed = false;
    const close = openChatStream({
      onTyping: (item) => {
        if (closed || !sameId(item.userId, userId)) return;
        if (typingIdleRef.current) window.clearTimeout(typingIdleRef.current);
        if (!item.typing) {
          setPeerTyping(false);
          return;
        }
        setPeerTyping(true);
        typingIdleRef.current = window.setTimeout(() => setPeerTyping(false), 2500);
      },
      onItem: (item) => {
        if (closed || !item?.id) return;
        const fromPeer = sameId(item.senderId, userId);
        const toPeer = sameId(item.recipientId, userId);
        if (!fromPeer && !toPeer) return;
        if (fromPeer) {
          if (typingIdleRef.current) window.clearTimeout(typingIdleRef.current);
          setPeerTyping(false);
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
      if (typingIdleRef.current) window.clearTimeout(typingIdleRef.current);
      close();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [authReady, isLoggedIn, load, userId]);

  const reportTyping = (active) => {
    if (!isLoggedIn || !userId) return;
    const now = Date.now();
    if (active) {
      if (typingSentRef.current && now - typingPingRef.current < 1200) return;
      typingSentRef.current = true;
      typingPingRef.current = now;
      signalChatTyping(userId, true).catch(() => {});
      return;
    }
    if (!typingSentRef.current) return;
    typingSentRef.current = false;
    typingPingRef.current = 0;
    signalChatTyping(userId, false).catch(() => {});
  };

  useEffect(() => () => {
    if (typingSentRef.current && userId) signalChatTyping(userId, false).catch(() => {});
  }, [userId]);

  const headerRgb = headerColor || HEADER_FALLBACK;

  const notice = !authReady || !ready
    ? ''
    : !isLoggedIn
      ? (lang === 'ru' ? 'Войдите, чтобы открыть чат' : 'Suhbatni ochish uchun hisobingizga kiring')
      : !peer
        ? (lang === 'ru' ? 'Чат не открылся' : 'Suhbat ochilmadi')
        : '';

  return (
    <section
      className={`chat ${textLookClass(textChoice.look)}`.trim()}
      style={{
        ...(backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}),
        ...bubbleVars(bubbles),
        ...textVars(textChoice),
        '--chat-header-fill': `rgba(${headerRgb.r}, ${headerRgb.g}, ${headerRgb.b}, ${HEADER_ALPHA})`,
        '--chat-header-shadow': `rgba(${headerRgb.r}, ${headerRgb.g}, ${headerRgb.b}, ${HEADER_SHADOW_ALPHA})`,
        '--chat-header-ring': `rgb(${headerRgb.r}, ${headerRgb.g}, ${headerRgb.b})`,
      }}
      aria-label={peer?.name || (lang === 'ru' ? 'Чат' : 'Suhbat')}
    >
      <ChatHeader
        lang={lang}
        peer={peer}
        onBack={() => navigate(-1)}
      />
      <ChatThread
        messages={messages}
        selfId={profile?.id}
        notice={notice}
        typing={peerTyping}
      />
      {peerTyping ? (
        <div className="chat-typing" role="status" aria-label={lang === 'ru' ? 'Печатает' : 'Yozmoqda'}>
          <span className="chat-typing-dot" />
          <span className="chat-typing-dot" />
          <span className="chat-typing-dot" />
        </div>
      ) : null}
      <ChatComposer
        lang={lang}
        disabled={!isLoggedIn || !peer}
        onTyping={reportTyping}
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
