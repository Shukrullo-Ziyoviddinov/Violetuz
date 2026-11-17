import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { fetchChatThread, fetchMyChatBackground, openChatStream, sendChatMessage, signalChatTyping } from '../../../api/messagesApi';
import { unwatchPresence, watchPresence } from '../../../api/presenceApi';
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

const dropMatchedPending = (rows, incoming) => {
  const left = [...rows];
  incoming.forEach((item) => {
    const index = left.findIndex((row) => (
      row.status === 'sending'
      && row.text === item.text
      && sameId(row.senderId, item.senderId)
    ));
    if (index >= 0) left.splice(index, 1);
  });
  return left;
};

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
  const [peerOnline, setPeerOnline] = useState(false);
  const [pending, setPending] = useState([]);
  const loadToken = useRef(0);
  const typingIdleRef = useRef(null);
  const typingSentRef = useRef(false);
  const typingPingRef = useRef(0);
  const localSeq = useRef(0);

  const load = useCallback(() => {
    const token = ++loadToken.current;
    if (!userId) return Promise.resolve({ stale: true });
    return fetchChatThread(userId).then(
      (data) => {
        const stale = token !== loadToken.current;
        if (!stale) {
          setPeer(data?.peer || null);
          const incoming = Array.isArray(data?.messages) ? data.messages : [];
          setMessages(incoming);
          setPending((current) => dropMatchedPending(current, incoming));
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
      setPending([]);
      setReady(true);
      return undefined;
    }
    let cancelled = false;
    setPending([]);
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
    if (!authReady || !isLoggedIn || !userId) {
      setPeerOnline(false);
      return undefined;
    }
    let cancelled = false;
    setPeerOnline(false);
    watchPresence(userId)
      .then((online) => {
        if (!cancelled) setPeerOnline(online);
      })
      .catch(() => {
        if (!cancelled) setPeerOnline(false);
      });
    const onPresence = (event) => {
      if (cancelled || !sameId(event.detail?.userId, userId)) return;
      setPeerOnline(event.detail.online === true);
    };
    window.addEventListener('violet-presence', onPresence);
    return () => {
      cancelled = true;
      window.removeEventListener('violet-presence', onPresence);
      unwatchPresence(userId).catch(() => {});
    };
  }, [authReady, isLoggedIn, userId]);

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
        setPending((current) => dropMatchedPending(current, [item]));
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

  const deliver = (localId, text) => {
    sendChatMessage(userId, text)
      .then((saved) => {
        if (!saved?.id) {
          setPending((current) => current.map((row) => (
            row.id === localId ? { ...row, status: 'failed' } : row
          )));
          return;
        }
        setPending((current) => current.filter((row) => row.id !== localId));
        setMessages((current) => (
          current.some((row) => row.id === saved.id) ? current : [...current, saved]
        ));
      })
      .catch(() => {
        setPending((current) => current.map((row) => (
          row.id === localId ? { ...row, status: 'failed' } : row
        )));
      });
  };

  const sendNow = (text) => {
    const localId = `local-${Date.now()}-${localSeq.current + 1}`;
    localSeq.current += 1;
    setPending((current) => [...current, {
      id: localId,
      senderId: profile?.id,
      recipientId: userId,
      text,
      createdAt: new Date().toISOString(),
      status: 'sending',
    }]);
    deliver(localId, text);
  };

  const retrySend = (localId) => {
    let text = '';
    setPending((current) => current.map((row) => {
      if (row.id !== localId) return row;
      text = row.text;
      return { ...row, status: 'sending' };
    }));
    if (text) deliver(localId, text);
  };

  const shownMessages = useMemo(() => (
    [...messages, ...pending].sort((left, right) => (
      new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime()
    ))
  ), [messages, pending]);

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
        online={peerOnline}
      />
      <ChatThread
        messages={shownMessages}
        selfId={profile?.id}
        notice={notice}
        typing={peerTyping}
        lang={lang}
        onRetry={retrySend}
      />
      {peerTyping ? (
        <div className="chat-typing" role="status">
          {lang === 'ru' ? 'Печатает...' : 'Yozmoqda...'}
        </div>
      ) : null}
      <ChatComposer
        lang={lang}
        disabled={!isLoggedIn || !peer}
        onTyping={reportTyping}
        onSend={sendNow}
      />
    </section>
  );
};

export default Chat;
