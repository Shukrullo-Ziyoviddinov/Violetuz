import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import UserAvatar from '../../UserAvatar/UserAvatar';
import ChatMessageBlock from './ChatMessageBlock';
import ChatReplySwipe from './ChatReplySwipe';

const clockIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const alertIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8v5" strokeLinecap="round" />
    <circle cx="12" cy="16.2" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

const checkIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="M5 12.5 9.2 17 19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const readIcon = (
  <svg width="16" height="12" viewBox="0 0 28 14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="M1.5 7.5 5.2 11.2 12.5 3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 7.5 12.7 11.2 20 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const pinMark = (
  <svg className="chat-send-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path d="M9 4.2h6l-.8 5.2 2.6 2.4H7.2L9.8 9.4 9 4.2Z" strokeLinejoin="round" />
    <path d="M12 11.8V20" strokeLinecap="round" />
  </svg>
);

const initialsOf = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatClock = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const sameId = (left, right) => String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();

const replyLabel = (item, mine, selfId, lang) => {
  const quoteMine = sameId(item.replyTo?.senderId, selfId);
  if (lang === 'ru') {
    if (mine && quoteMine) return 'Ответ себе';
    if (mine) return 'Ваш ответ';
    if (quoteMine) return 'Вам ответили';
    return 'Ответ себе';
  }
  if (mine && quoteMine) return 'O‘zingizga javob';
  if (mine) return 'Sizning javobingiz';
  if (quoteMine) return 'Sizga javob berdi';
  return 'O‘ziga javob';
};

const sendCopy = (lang) => (lang === 'ru'
  ? { sending: 'Отправляется', failed: 'Не отправлено', retry: 'Повторить', delivered: 'Доставлено', read: 'Прочитано' }
  : { sending: 'Yuborilmoqda', failed: 'Yuborilmadi', retry: 'Qayta urinish', delivered: 'Yetkazildi', read: 'O‘qildi' });

const ChatSendStatus = ({ item, lang, onRetry, peer, pinned = false }) => {
  const copy = sendCopy(lang);
  const status = item.status || 'sent';
  const mark = pinned ? pinMark : null;
  if (status === 'sending') {
    return (
      <p className="chat-send-status">
        {mark}
        <span>{copy.sending}</span>
        {clockIcon}
      </p>
    );
  }
  if (status === 'failed') {
    return (
      <button type="button" className="chat-send-status is-failed" onClick={() => onRetry?.(item.id)}>
        {mark}
        <span>{`${copy.failed} · ${copy.retry}`}</span>
        {alertIcon}
      </button>
    );
  }
  const clock = formatClock(item.createdAt);
  if (item.readAt) {
    return (
      <p className="chat-send-status is-read">
        {mark}
        {readIcon}
        <span>{clock ? `${clock} · ${copy.read}` : copy.read}</span>
        <span className="chat-send-avatar">
          <UserAvatar
            src={peer?.avatar}
            className="chat-send-avatar-img"
            alt=""
            fallback={<span>{initialsOf(peer?.name)}</span>}
          />
        </span>
      </p>
    );
  }
  return (
    <p className="chat-send-status">
      {mark}
      <span>{clock ? `${clock} · ${copy.delivered}` : copy.delivered}</span>
      {checkIcon}
    </p>
  );
};

const overlaySpace = (node, name) => {
  const value = Number.parseFloat(getComputedStyle(node).getPropertyValue(name));
  return Number.isFinite(value) ? value : 0;
};

export const revealRepliedMessage = (thread, messageId) => {
  const id = String(messageId || '').trim();
  if (!thread || !id) return;
  const escaped = window.CSS?.escape ? CSS.escape(id) : id.replace(/"/g, '');
  const item = thread.querySelector(`[data-message-id="${escaped}"]`);
  const block = item?.querySelector('.chat-block');
  if (!item || !block) return;
  const chat = thread.parentElement || thread;
  const viewTop = overlaySpace(chat, '--chat-overlay-top') + 8;
  const viewBottomGap = overlaySpace(chat, '--chat-overlay-bottom') + 8;
  const threadRect = thread.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const limitTop = threadRect.top + viewTop;
  const limitBottom = threadRect.bottom - viewBottomGap;
  if (itemRect.top < limitTop || itemRect.bottom > limitBottom) {
    thread.scrollTo({
      top: Math.max(0, thread.scrollTop + itemRect.top - limitTop),
      behavior: 'smooth',
    });
  }
  if (block._replyFlashDone) block.removeEventListener('animationend', block._replyFlashDone);
  const token = {};
  block._replyFlash = token;
  block.classList.remove('is-reply-flash');
  void block.offsetWidth;
  block.classList.add('is-reply-flash');
  const done = (event) => {
    if (event.animationName !== 'chat-reply-flash' || block._replyFlash !== token) return;
    block.removeEventListener('animationend', done);
    block.classList.remove('is-reply-flash');
  };
  block._replyFlashDone = done;
  block.addEventListener('animationend', done);
};

const reactionMap = (rows) => {
  const next = new Map();
  rows.forEach((item) => {
    const mine = new Map();
    (item.reactions || []).forEach((reaction) => {
      if (!reaction?.emoji) return;
      mine.set(String(reaction.userId || ''), reaction.emoji);
    });
    next.set(String(item.id), mine);
  });
  return next;
};

const ChatThread = ({ messages, selfId, notice, typing, lang, onRetry, onReply, onHold, heldId, peer, pins = [], selfName = '', selfAvatar = '', onClearReaction, onCancelUpload, onOpenVideo, onDownloadVideo }) => {
  const threadRef = useRef(null);
  const listRef = useRef(null);
  const stickRef = useRef(true);
  const openedRef = useRef(false);
  const knownReactionsRef = useRef(null);
  const primedRef = useRef(false);
  const [pop, setPop] = useState(null);

  useEffect(() => {
    if (!messages.length) {
      primedRef.current = false;
      knownReactionsRef.current = new Map();
      return undefined;
    }
    const next = reactionMap(messages);
    if (!primedRef.current) {
      primedRef.current = true;
      knownReactionsRef.current = next;
      return undefined;
    }
    let landed = null;
    next.forEach((mine, id) => {
      mine.forEach((emoji, userKey) => {
        const prev = knownReactionsRef.current?.get(id)?.get(userKey);
        if (prev !== emoji) landed = { id, userKey, emoji };
      });
    });
    knownReactionsRef.current = next;
    if (!landed) return undefined;
    setPop({ ...landed, token: `${landed.id}:${landed.userKey}:${landed.emoji}:${Date.now()}` });
    try {
      navigator.vibrate?.(18);
    } catch (_err) {
      // Qurilma tebranishni qo‘llamasa emoji animatsiyasi baribir yuradi.
    }
    return undefined;
  }, [messages]);

  const pinBottom = () => {
    const node = threadRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
    stickRef.current = true;
  };

  const onThreadScroll = () => {
    const node = threadRef.current;
    if (!node) return;
    const gap = node.scrollHeight - node.scrollTop - node.clientHeight;
    stickRef.current = gap < 64;
  };

  useLayoutEffect(() => {
    if (!messages.length) {
      openedRef.current = false;
      return undefined;
    }
    if (!openedRef.current || stickRef.current) {
      openedRef.current = true;
      pinBottom();
    }
    const list = listRef.current;
    if (!list || typeof ResizeObserver !== 'function') return undefined;
    const observer = new ResizeObserver(() => {
      if (stickRef.current) pinBottom();
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, [messages, typing]);

  const onThreadClick = (event) => {
    const quote = event.target.closest?.('.chat-reply-quote');
    if (!quote || !threadRef.current?.contains(quote)) return;
    revealRepliedMessage(threadRef.current, quote.getAttribute('data-reply-id'));
  };

  return (
    <div className="chat-thread" ref={threadRef} onClick={onThreadClick} onScroll={onThreadScroll}>
      <div className="chat-thread-list" ref={listRef}>
      {notice ? <p className="chat-notice">{notice}</p> : null}
      {messages.map((item) => {
        const mine = String(item.senderId || '').trim().toLowerCase() === String(selfId || '').trim().toLowerCase();
        const clock = formatClock(item.createdAt);
        const quote = String(item.replyTo?.text || '').trim();
        const pinned = pins.some((pin) => sameId(pin.id, item.id));
        const reactions = [...(item.reactions || [])]
          .filter((reaction) => reaction?.emoji)
          .sort((left, right) => new Date(left.at || 0) - new Date(right.at || 0));
        return (
          <div
            key={item.id}
            className={`chat-item${mine ? ' is-mine' : ''}${heldId && heldId === item.id ? ' is-held' : ''}`}
            data-message-id={item.id}
            onContextMenu={(event) => event.preventDefault()}
            onPointerDown={(event) => {
              if (event.button != null && event.button !== 0) return;
              if (String(item.id || '').startsWith('local-')) return;
              const node = event.currentTarget;
              const startX = event.clientX;
              const startY = event.clientY;
              const timer = window.setTimeout(() => {
                if (!node.isConnected) return;
                const block = node.querySelector('.chat-block') || node;
                const glyph = block.classList?.contains('is-emoji')
                  && !block.classList.contains('is-anim')
                  && !block.classList.contains('is-gif')
                  ? block.querySelector('.chat-emoji-still, .chat-emoji-solo, .chat-block-text')
                  : null;
                const rect = (glyph || block).getBoundingClientRect();
                onHold?.({
                  item,
                  mine,
                  quote,
                  anchor: {
                    top: rect.top,
                    left: rect.left,
                    right: rect.right,
                    bottom: rect.bottom,
                    width: rect.width,
                  },
                });
              }, 420);
              const move = (ev) => {
                if (Math.hypot(ev.clientX - startX, ev.clientY - startY) <= 10) return;
                window.clearTimeout(timer);
                end();
              };
              const end = () => {
                window.clearTimeout(timer);
                window.removeEventListener('pointermove', move);
                window.removeEventListener('pointerup', end);
                window.removeEventListener('pointercancel', end);
              };
              window.addEventListener('pointermove', move);
              window.addEventListener('pointerup', end);
              window.addEventListener('pointercancel', end);
            }}
          >
            {quote ? <p className="chat-reply-label">{replyLabel(item, mine, selfId, lang)}</p> : null}
            <ChatReplySwipe
              mine={mine}
              onReply={() => {
                if (String(item.id || '').startsWith('local-')) return false;
                onReply?.(item);
                return true;
              }}
            >
              <ChatMessageBlock
                text={item.text}
                mine={mine}
                held={heldId === item.id}
                quote={quote}
                replyId={item.replyTo?.id || ''}
                animated={item.animated === true}
                animationId={item.animationId || ''}
                gif={item.gif || ''}
                video={item.video?.url ? item.video : null}
                uploading={item.uploading === true}
                failed={item.failed === true}
                progress={item.progress || 0}
                downloadProgress={item.downloadProgress}
                onCancelUpload={item.uploading || item.failed ? () => onCancelUpload?.(item.id) : undefined}
                onDownload={!mine && item.video?.url && !item.video.playback && !String(item.video.url).startsWith('blob:') && item.downloadProgress == null && !item.uploading && !item.failed ? () => onDownloadVideo?.(item) : undefined}
                onOpen={!item.uploading && !item.failed && item.video?.url && (mine || item.video.playback || String(item.video.url).startsWith('blob:')) ? () => onOpenVideo?.(item) : undefined}
                quoteAnimated={item.replyTo?.animated === true}
                quoteAnimationId={item.replyTo?.animationId || ''}
                quoteGif={item.replyTo?.gif || ''}
                status={item.video?.url && (item.uploading || item.failed) ? null : (mine
                  ? <ChatSendStatus item={item} lang={lang} onRetry={onRetry} peer={peer} pinned={pinned} />
                  : (clock || pinned ? <p className="chat-send-status is-in">{pinned ? pinMark : null}{clock}</p> : null))}
              />
            </ChatReplySwipe>
            {reactions.length ? (
              <span className="chat-reacts">
                {reactions.map((reaction) => {
                  const self = sameId(reaction.userId, selfId);
                  const person = self
                    ? { name: selfName, avatar: selfAvatar }
                    : { name: peer?.name, avatar: peer?.avatar };
                  const popping = pop
                    && pop.id === String(item.id)
                    && sameId(pop.userKey, reaction.userId)
                    && pop.emoji === reaction.emoji;
                  const body = (
                    <>
                      <span className="chat-react-avatar">
                        <UserAvatar
                          src={person.avatar}
                          className="chat-react-avatar-img"
                          alt=""
                          fallback={<span>{initialsOf(person.name)}</span>}
                        />
                      </span>
                      <span
                        key={popping ? pop.token : 'emoji'}
                        className={`chat-react-emoji${popping ? ' is-pop' : ''}`}
                      >
                        {reaction.emoji}
                      </span>
                    </>
                  );
                  if (!self) {
                    return (
                      <span key={reaction.userId} className="chat-react is-peer">
                        {body}
                      </span>
                    );
                  }
                  return (
                    <button
                      key={reaction.userId}
                      type="button"
                      className="chat-react is-self"
                      aria-label={lang === 'ru' ? 'Убрать реакцию' : 'Reaksiyani olish'}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        onClearReaction?.(item);
                      }}
                    >
                      {body}
                    </button>
                  );
                })}
              </span>
            ) : null}
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default ChatThread;
