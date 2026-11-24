import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { fetchChatThread, fetchMyChatBackground, openChatStream, sendChatMessage, signalChatTyping, deleteChatMessage, editChatMessage, pinChatMessage, unpinChatMessage } from '../../../api/messagesApi';
import { unwatchPresence, watchPresence } from '../../../api/presenceApi';
import { getDominantColor } from '../../../utils/dominantColor';
import { bubbleVars, readBubbleChoice } from './chatBubbles';
import { readTextChoice, textLookClass, textVars } from './chatTextFont';
import { rememberEmoji } from './chatEmojis';
import { useModalHardwareBack } from '../../../useModalHardwareBack';
import ChatHeader from './ChatHeader';
import ChatThread, { revealRepliedMessage } from './ChatThread';
import ChatComposer from './ChatComposer';
import ChatMessageHold from './ChatMessageHold';
import ChatReactionModal from './ChatReactionModal';
import ChatDeleteMessageModal from './ChatDeleteMessageModal';
import ChatPinMessageModal from './ChatPinMessageModal';
import ChatPinnedBar from './ChatPinnedBar';
import { gifByFile } from './chatGifs';
import { shatterElement, SHATTER_MS } from './chatShatter';
import './Chat.css';

const DEFAULT_CHAT_BG = '/img/chat-backgrounds/chat-bg-1.jpg';
const HEADER_FALLBACK = { r: 20, g: 16, b: 31 };
const HEADER_ALPHA = 0.8;
const HEADER_PILL_ALPHA = 0.92;
const HEADER_SHADOW_ALPHA = 0.34;

const sameId = (left, right) => String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();

const replyOf = (item) => (item?.replyTo?.text ? item.replyTo : null);

const withKeptReply = (item, fallback) => (
  replyOf(item) ? item : { ...item, replyTo: replyOf(fallback) }
);

const upsertMessage = (current, item) => {
  const index = current.findIndex((row) => row.id === item.id);
  if (index < 0) return [...current, item];
  const replyTo = replyOf(item) || replyOf(current[index]);
  const animationId = item.animationId || current[index].animationId || '';
  const gif = item.gif || current[index].gif || '';
  const next = current.slice();
  next[index] = {
    ...current[index],
    ...item,
    replyTo,
    ...(animationId ? { animationId, animated: true } : {}),
    ...(gif ? { gif } : {}),
  };
  return next;
};

const pendingMatch = (row, item) => (
  row.status === 'sending'
  && row.text === item.text
  && sameId(row.senderId, item.senderId)
);

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
  const [replyTarget, setReplyTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [pins, setPins] = useState([]);
  const [hold, setHold] = useState(null);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const loadToken = useRef(0);
  const typingIdleRef = useRef(null);
  const typingSentRef = useRef(false);
  const typingPingRef = useRef(0);
  const localSeq = useRef(0);
  const chatRef = useRef(null);
  const pendingRef = useRef(pending);
  const repliesRef = useRef(new Map());
  const holdRef = useRef(null);
  const holdUiRef = useRef(null);
  const reactionUiRef = useRef(null);
  const closeHoldRef = useRef(() => {});
  const dismissHoldRef = useRef(() => {});
  const flyMessageAwayRef = useRef(() => {});
  const flyQuotesAwayRef = useRef(() => {});
  pendingRef.current = pending;
  const paintEditRef = useRef(() => {});
  holdRef.current = hold;

  const closeHoldUi = () => {
    setHold(null);
    setReactionOpen(false);
    setDeleteOpen(false);
    setDeleteBusy(false);
    setPinOpen(false);
    setPinBusy(false);
  };

  dismissHoldRef.current = (after) => {
    if (holdUiRef.current?.close) {
      holdUiRef.current.close(after);
      return;
    }
    after?.();
  };

  const { releaseAll } = useModalHardwareBack({
    historyKey: 'violetChatHold',
    isOpen: Boolean(hold),
    hasNested: reactionOpen || deleteOpen || pinOpen,
    onNestedBack: () => {
      if (reactionUiRef.current?.close) {
        reactionUiRef.current.close();
        return;
      }
      if (pinOpen) {
        setPinOpen(false);
        return;
      }
      setReactionOpen(false);
      setDeleteOpen(false);
    },
    onCloseFromHardware: () => dismissHoldRef.current(closeHoldUi),
  });
  closeHoldRef.current = () => dismissHoldRef.current(releaseAll);

  const rememberReply = (messageId, replyTo) => {
    if (messageId && replyTo?.text) repliesRef.current.set(messageId, replyTo);
  };

  const keepReply = (item, fallback = null) => {
    const shown = withKeptReply(item, fallback || { replyTo: repliesRef.current.get(item?.id) });
    rememberReply(shown.id, replyOf(shown));
    return shown;
  };

  const paintEdit = (payload) => {
    const id = String(payload?.id || '');
    const text = String(payload?.text || '');
    if (!id || !text) return;
    const related = Array.isArray(payload?.related) ? payload.related : [];
    const relatedText = (value) => {
      const hit = related.find((item) => sameId(item?.id, value));
      return hit ? String(hit.text || '') : '';
    };
    const quotePlain = (replyTo) => replyTo?.text && !replyTo.gif && !replyTo.animationId && replyTo.animated !== true;
    const mapRow = (row) => {
      let next = row;
      const relatedBody = relatedText(row.id);
      if (sameId(row.id, id)) {
        next = { ...next, text };
        if (Object.prototype.hasOwnProperty.call(payload, 'replyTo')) next = { ...next, replyTo: payload.replyTo || null };
      } else if (relatedBody) {
        next = { ...next, text: relatedBody };
      }
      if (quotePlain(next.replyTo)) {
        if (sameId(next.replyTo.id, id)) next = { ...next, replyTo: { ...next.replyTo, text } };
        const quotedBody = relatedText(next.replyTo.id);
        if (quotedBody) next = { ...next, replyTo: { ...next.replyTo, text: quotedBody } };
      }
      if (next.replyTo?.text) rememberReply(next.id, next.replyTo);
      return next;
    };
    repliesRef.current.forEach((value, key) => {
      if (!value) return;
      if (sameId(value.id, id)) repliesRef.current.set(key, { ...value, text });
      const quotedBody = relatedText(value.id);
      if (quotedBody) repliesRef.current.set(key, { ...value, text: quotedBody });
    });
    setMessages((current) => current.map(mapRow));
    setPending((current) => current.map(mapRow));
    setPins((current) => current.map((pin) => (
      sameId(pin.id, id) ? { ...pin, text } : pin
    )));
  };
  paintEditRef.current = paintEdit;

  useLayoutEffect(() => {
    const root = chatRef.current;
    if (!root) return undefined;
      const header = root.querySelector('.chat-header');
      const composer = root.querySelector('.chat-composer-wrap');
      const apply = () => {
        const typing = root.querySelector('.chat-typing');
        const pin = root.querySelector('.chat-pin');
        const pinSpace = pin ? pin.offsetHeight + 16 : 0;
        const top = (header?.offsetHeight || 0) + pinSpace;
        const bottom = (composer?.offsetHeight || 0) + (typing ? typing.offsetHeight + 12 : 0);
      root.style.setProperty('--chat-overlay-top', `${top}px`);
      root.style.setProperty('--chat-overlay-bottom', `${bottom}px`);
    };
    apply();
    if (typeof ResizeObserver !== 'function') return undefined;
    const observer = new ResizeObserver(apply);
    if (header) observer.observe(header);
    if (composer) observer.observe(composer);
    const pin = root.querySelector('.chat-pin');
    if (pin) observer.observe(pin);
    return () => observer.disconnect();
  }, [peerTyping, pins.length]);

  const load = useCallback(() => {
    const token = ++loadToken.current;
    if (!userId) return Promise.resolve({ stale: true });
    return fetchChatThread(userId).then(
      (data) => {
        const stale = token !== loadToken.current;
        if (!stale) {
          setPeer(data?.peer || null);
          const incoming = Array.isArray(data?.messages) ? data.messages : [];
          const kept = incoming.map((item) => {
            const local = pendingRef.current.find((row) => pendingMatch(row, item));
            const withAnim = item.animationId || !local?.animationId
              ? item
              : { ...item, animationId: local.animationId, animated: true };
            const withGif = withAnim.gif || !local?.gif
              ? withAnim
              : { ...withAnim, gif: local.gif };
            return keepReply(withGif, local);
          });
          setMessages(kept);
          setPins(Array.isArray(data?.pins) ? data.pins : []);
          setPending((current) => dropMatchedPending(current, kept));
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
      setPins([]);
      setPending([]);
      setReplyTarget(null);
      setEditTarget(null);
      setReady(true);
      return undefined;
    }
    let cancelled = false;
    setPending([]);
    setPins([]);
    setReplyTarget(null);
    setEditTarget(null);
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

  const dropQuotedReply = (id) => {
    for (const [key, value] of repliesRef.current) {
      if (sameId(value?.id, id)) repliesRef.current.delete(key);
    }
    const strip = (row) => (sameId(row?.replyTo?.id, id) ? { ...row, replyTo: null } : row);
    setMessages((current) => current.map(strip));
    setPending((current) => current.map(strip));
    setReplyTarget((current) => (sameId(current?.id, id) ? null : current));
  };

  const flyQuotesAway = (id) => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && typeof CSS !== 'undefined' && CSS.escape) {
      const nodes = document.querySelectorAll(`.chat-reply-quote[data-reply-id="${CSS.escape(String(id))}"]`);
      const layers = [...nodes].map((node) => shatterElement(node)).filter(Boolean);
      window.setTimeout(() => layers.forEach((layer) => layer.remove()), SHATTER_MS);
    }
    dropQuotedReply(id);
  };
  flyQuotesAwayRef.current = flyQuotesAway;

  flyMessageAwayRef.current = (id, after) => {
      const finish = () => {
      setMessages((current) => current.filter((row) => row.id !== id));
      setPending((current) => current.filter((row) => row.id !== id));
      setPins((current) => current.filter((row) => !sameId(row.id, id)));
      after?.();
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    if (holdRef.current?.id === id && holdUiRef.current?.shatter) {
      holdUiRef.current.shatter(finish);
      return;
    }
    const row = document.querySelector(`[data-message-id="${CSS.escape(String(id))}"]`);
    const block = row?.querySelector('.chat-block') || row;
    const layer = block ? shatterElement(block) : null;
    if (!row || !layer) {
      finish();
      return;
    }
    row.classList.add('is-shattering');
    window.setTimeout(() => {
      layer.remove();
      finish();
    }, SHATTER_MS);
  };

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
      onRead: (item) => {
        if (closed || !sameId(item.userId, userId) || !item.readAt) return;
        setMessages((current) => current.map((row) => {
          if (sameId(row.senderId, userId) || row.readAt) return row;
          return { ...row, readAt: item.readAt };
        }));
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
        const local = pendingRef.current.find((row) => pendingMatch(row, item));
        const shown = keepReply(item, local);
        setPending((current) => dropMatchedPending(current, [shown]));
        setMessages((current) => upsertMessage(current, shown));
      },
      onEdit: (item) => {
        if (closed || !item?.id) return;
        paintEditRef.current(item);
      },
      onPin: (item) => {
        if (closed || !item?.id) return;
        if (item.pinned) {
          setPins((current) => [
            {
              id: item.id,
              text: String(item.text || ''),
              animated: item.animated === true,
              ...(item.animationId ? { animationId: item.animationId } : {}),
              ...(item.gif ? { gif: item.gif } : {}),
              at: item.at || new Date().toISOString(),
            },
            ...current.filter((row) => !sameId(row.id, item.id)),
          ].sort((left, right) => new Date(right.at || 0) - new Date(left.at || 0)));
          return;
        }
        setPins((current) => current.filter((row) => !sameId(row.id, item.id)));
      },
      onDelete: (item) => {
        if (closed || !item?.id) return;
        const id = item.id;
        const held = holdRef.current?.id === id;
        flyQuotesAwayRef.current(id);
        flyMessageAwayRef.current(id, () => {
          if (held) closeHoldRef.current();
        });
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

  const deliver = (localId, text, replyTo = null, animationId = '', gif = '') => {
    sendChatMessage(userId, text, replyTo, animationId, gif)
      .then((saved) => {
        if (!saved?.id) {
          setPending((current) => current.map((row) => (
            row.id === localId ? { ...row, status: 'failed' } : row
          )));
          return;
        }
        const sentId = String(animationId || '').trim();
        const sentGif = String(gif || '').trim();
        let mergedBase = saved;
        if (sentId && !mergedBase.animationId) mergedBase = { ...mergedBase, animationId: sentId, animated: true };
        if (sentGif && !mergedBase.gif) mergedBase = { ...mergedBase, gif: sentGif };
        if (mergedBase.replyTo && replyTo?.animationId && !mergedBase.replyTo.animationId) {
          mergedBase = { ...mergedBase, replyTo: { ...mergedBase.replyTo, animationId: replyTo.animationId, animated: true } };
        }
        if (mergedBase.replyTo && replyTo?.gif && !mergedBase.replyTo.gif) {
          mergedBase = { ...mergedBase, replyTo: { ...mergedBase.replyTo, gif: replyTo.gif } };
        }
        const merged = mergedBase;
        const shown = keepReply(withKeptReply(merged, replyTo), replyTo);
        rememberReply(localId, replyOf(shown));
        setPending((current) => current.filter((row) => row.id !== localId));
        setMessages((current) => upsertMessage(current, shown));
      })
      .catch(() => {
        setPending((current) => current.map((row) => (
          row.id === localId ? { ...row, status: 'failed' } : row
        )));
      });
  };

  const beginReply = (item) => {
    const text = String(item?.text || '').trim();
    if (!item?.id || !text || String(item.id).startsWith('local-')) return false;
    setEditTarget(null);
    setReplyTarget({
      id: item.id,
      senderId: item.senderId,
      text,
      ...(item.animationId ? { animationId: item.animationId } : {}),
      ...(item.gif ? { gif: item.gif } : {}),
      ...(item.animated || item.animationId ? { animated: true } : {}),
    });
    return true;
  };

  const beginEdit = (item) => {
    const text = String(item?.text || '').trim();
    if (!item?.id || !item?.mine || !text || String(item.id).startsWith('local-')) return false;
    if (item.gif || item.animationId || item.animated) return false;
    const quotePlain = Boolean(String(item.quote || '').trim())
      && !item.quoteGif
      && !item.quoteAnimationId
      && item.quoteAnimated !== true;
    setReplyTarget(null);
    setEditTarget({
      id: item.id,
      text,
      preview: text,
      quoteText: quotePlain ? String(item.quote) : '',
      quoteEditable: quotePlain,
      quoteId: quotePlain ? item.replyId || '' : '',
      quoteMine: quotePlain && sameId(item.quoteSenderId, profile?.id),
    });
    return true;
  };

  const commitEdit = (text, quoteText) => {
    const target = editTarget;
    if (!target?.id) return;
    const before = messages;
    const cachedReplies = new Map(repliesRef.current);
    const nextQuote = String(quoteText || '').trim();
    const replyTo = target.quoteEditable
      ? {
        ...(messages.find((row) => row.id === target.id)?.replyTo || {}),
        text: nextQuote || target.quoteText,
      }
      : undefined;
    const related = target.quoteMine && target.quoteId && nextQuote && nextQuote !== target.quoteText
      ? [{ id: target.quoteId, text: nextQuote }]
      : [];
    paintEdit({
      id: target.id,
      text,
      ...(replyTo ? { replyTo } : {}),
      related,
    });
    setEditTarget(null);
    reportTyping(false);
    editChatMessage(target.id, text, target.quoteEditable ? quoteText : undefined)
      .then((saved) => {
        if (saved?.id) paintEdit(saved);
      })
      .catch(() => {
        repliesRef.current = cachedReplies;
        setMessages(before);
        setEditTarget(target);
      });
  };

  const openHold = ({ item, mine, quote, anchor }) => {
    if (!item?.id || String(item.id).startsWith('local-')) return;
    setReactionOpen(false);
    setDeleteOpen(false);
    setPinOpen(false);
    setHold({
      id: item.id,
      text: item.text,
      senderId: item.senderId,
      mine,
      quote,
      replyId: item.replyTo?.id || '',
      animated: item.animated === true,
      animationId: item.animationId || '',
      gif: item.gif || '',
      quoteAnimated: item.replyTo?.animated === true,
      quoteAnimationId: item.replyTo?.animationId || '',
      quoteGif: item.replyTo?.gif || '',
      anchor,
      quoteSenderId: item.replyTo?.senderId || '',
      pinned: pins.some((pin) => sameId(pin.id, item.id)),
    });
  };

  const copyHold = async () => {
    const text = String(hold?.text || '');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    dismissHoldRef.current(releaseAll);
  };

  const confirmPin = (forPeer) => {
    const item = hold;
    if (!item?.id || pinBusy) return;
    const previous = pins;
    const next = {
      id: item.id,
      text: String(item.text || ''),
      animated: item.animated === true,
      ...(item.animationId ? { animationId: item.animationId } : {}),
      ...(item.gif ? { gif: item.gif } : {}),
      at: new Date().toISOString(),
    };
    setPins((current) => [next, ...current.filter((row) => !sameId(row.id, next.id))]
      .sort((left, right) => new Date(right.at || 0) - new Date(left.at || 0)));
    setPinOpen(false);
    setPinBusy(true);
    dismissHoldRef.current(releaseAll);
    pinChatMessage(item.id, forPeer)
      .catch(() => setPins(previous))
      .finally(() => setPinBusy(false));
  };

  const unpinHold = () => {
    const id = hold?.id;
    if (!id) return;
    const previous = pins;
    setPins((current) => current.filter((row) => !sameId(row.id, id)));
    unpinChatMessage(id).catch(() => setPins(previous));
    releaseAll();
  };

  const confirmDelete = (forPeer) => {
    const id = hold?.id;
    if (!id || deleteBusy) return;
    const kept = messages.find((row) => row.id === id) || pending.find((row) => row.id === id) || null;
    const quoted = [...messages, ...pending].filter((row) => sameId(row?.replyTo?.id, id));
    setDeleteBusy(true);
    setDeleteOpen(false);
    let failed = false;
    const request = deleteChatMessage(id, forPeer).catch(() => {
      failed = true;
    }).finally(() => setDeleteBusy(false));
    if (forPeer) flyQuotesAway(id);
    flyMessageAwayRef.current(id, () => {
      releaseAll();
      request.then(() => {
        if (!failed || !kept) return;
        setMessages((current) => {
          const restored = current.some((row) => row.id === id)
            ? current
            : [...current, kept].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
          if (!forPeer || !quoted.length) return restored;
          return restored.map((row) => {
            const previous = quoted.find((item) => item.id === row.id);
            return previous ? { ...row, replyTo: previous.replyTo } : row;
          });
        });
      });
    });
  };

  useEffect(() => {
    if (!hold) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (reactionUiRef.current?.close) {
        reactionUiRef.current.close();
        return;
      }
      if (pinOpen) {
        setPinOpen(false);
        return;
      }
      if (deleteOpen) {
        setDeleteOpen(false);
        return;
      }
      dismissHoldRef.current(releaseAll);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hold, deleteOpen, pinOpen, releaseAll]);

  const sendNow = (text) => {
    const replyTo = replyTarget;
    const localId = `local-${Date.now()}-${localSeq.current + 1}`;
    localSeq.current += 1;
    setReplyTarget(null);
    setPending((current) => [...current, {
      id: localId,
      senderId: profile?.id,
      recipientId: userId,
      text,
      createdAt: new Date().toISOString(),
      status: 'sending',
      replyTo: replyTo ? { ...replyTo } : null,
    }]);
    deliver(localId, text, replyTo);
  };

  const sendAnimation = (item) => {
    const animationId = String(item?.id || '').trim();
    const name = String(item?.name || '').trim();
    if (!/^[0-9]{1,12}$/.test(animationId) || !name) return;
    const replyTo = replyTarget;
    const localId = `local-${Date.now()}-${localSeq.current + 1}`;
    localSeq.current += 1;
    setReplyTarget(null);
    setPending((current) => [...current, {
      id: localId,
      senderId: profile?.id,
      recipientId: userId,
      text: name,
      animationId,
      animated: true,
      createdAt: new Date().toISOString(),
      status: 'sending',
      replyTo: replyTo ? { ...replyTo } : null,
    }]);
    deliver(localId, name, replyTo, animationId);
  };

  const sendGif = (item) => {
    const file = String(item?.file || '').trim();
    const known = gifByFile(file);
    const name = String(known?.name || item?.name || '').trim();
    if (!known || !name) return;
    const replyTo = replyTarget;
    const localId = `local-${Date.now()}-${localSeq.current + 1}`;
    localSeq.current += 1;
    setReplyTarget(null);
    setPending((current) => [...current, {
      id: localId,
      senderId: profile?.id,
      recipientId: userId,
      text: name,
      gif: file,
      createdAt: new Date().toISOString(),
      status: 'sending',
      replyTo: replyTo ? { ...replyTo } : null,
    }]);
    deliver(localId, name, replyTo, '', file);
  };

  const retrySend = (localId) => {
    let text = '';
    let replyTo = null;
    let animationId = '';
    let gif = '';
    setPending((current) => current.map((row) => {
      if (row.id !== localId) return row;
      text = row.text;
      replyTo = row.replyTo || null;
      animationId = row.animationId || '';
      gif = row.gif || '';
      return { ...row, status: 'sending' };
    }));
    if (text) deliver(localId, text, replyTo, animationId, gif);
  };

  const shownMessages = useMemo(() => (
    [...messages, ...pending]
      .map((item) => keepReply(item))
      .sort((left, right) => (
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
      ref={chatRef}
      className={`chat ${textLookClass(textChoice.look)}`.trim()}
      style={{
        ...(backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}),
        ...bubbleVars(bubbles),
        ...textVars(textChoice),
        '--chat-header-rgb': `${headerRgb.r}, ${headerRgb.g}, ${headerRgb.b}`,
        '--chat-header-fill': `rgba(${headerRgb.r}, ${headerRgb.g}, ${headerRgb.b}, ${HEADER_ALPHA})`,
        '--chat-header-pill': `rgba(${headerRgb.r}, ${headerRgb.g}, ${headerRgb.b}, ${HEADER_PILL_ALPHA})`,
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
      <ChatPinnedBar
        pins={pins}
        lang={lang}
        onJump={(id) => revealRepliedMessage(chatRef.current?.querySelector('.chat-thread'), id)}
      />
      <ChatThread
        messages={shownMessages}
        selfId={profile?.id}
        notice={notice}
        typing={peerTyping}
        lang={lang}
        onRetry={retrySend}
        onReply={beginReply}
        onHold={openHold}
        heldId={hold?.id || ''}
        peer={peer}
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
        onSend={sendNow}
        onSendAnimation={sendAnimation}
        onSendGif={sendGif}
        reply={editTarget ? null : replyTarget}
        edit={editTarget}
        selfId={profile?.id}
        peerName={peer?.name}
        onCancelReply={() => setReplyTarget(null)}
        onCancelEdit={() => setEditTarget(null)}
        onCommitEdit={commitEdit}
      />
      {hold ? (
        <ChatMessageHold
          ref={holdUiRef}
          message={hold}
          anchor={hold.anchor}
          lang={lang}
          onClose={releaseAll}
          onReply={() => {
            beginReply(hold);
            releaseAll();
          }}
          onCopy={copyHold}
          onPin={() => setPinOpen(true)}
          onUnpin={unpinHold}
          onEdit={() => {
            beginEdit(hold);
            releaseAll();
          }}
          onDelete={() => setDeleteOpen(true)}
          onPick={(emoji) => {
            if (emoji?.id) rememberEmoji(emoji.id);
            releaseAll();
          }}
          onMore={() => setReactionOpen(true)}
        />
      ) : null}
      {hold && reactionOpen ? (
        <ChatReactionModal
          ref={reactionUiRef}
          lang={lang}
          onClose={() => setReactionOpen(false)}
          onPick={() => dismissHoldRef.current(releaseAll)}
        />
      ) : null}
      {hold && pinOpen ? (
        <ChatPinMessageModal
          peerName={peer?.name}
          lang={lang}
          busy={pinBusy}
          onClose={() => setPinOpen(false)}
          onConfirm={confirmPin}
        />
      ) : null}
      {hold && deleteOpen ? (
        <ChatDeleteMessageModal
          peerName={peer?.name}
          lang={lang}
          busy={deleteBusy}
          onClose={() => setDeleteOpen(false)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </section>
  );
};

export default Chat;
