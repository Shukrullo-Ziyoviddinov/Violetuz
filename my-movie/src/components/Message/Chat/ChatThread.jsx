import React, { useEffect, useRef } from 'react';
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

const ChatSendStatus = ({ item, lang, onRetry, peer }) => {
  const copy = sendCopy(lang);
  const status = item.status || 'sent';
  if (status === 'sending') {
    return (
      <p className="chat-send-status">
        <span>{copy.sending}</span>
        {clockIcon}
      </p>
    );
  }
  if (status === 'failed') {
    return (
      <button type="button" className="chat-send-status is-failed" onClick={() => onRetry?.(item.id)}>
        <span>{`${copy.failed} · ${copy.retry}`}</span>
        {alertIcon}
      </button>
    );
  }
  const clock = formatClock(item.createdAt);
  if (item.readAt) {
    return (
      <p className="chat-send-status is-read">
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
      <span>{clock ? `${clock} · ${copy.delivered}` : copy.delivered}</span>
      {checkIcon}
    </p>
  );
};

const ChatThread = ({ messages, selfId, notice, typing, lang, onRetry, onReply, peer }) => {
  const threadRef = useRef(null);

  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, typing]);

  return (
    <div className="chat-thread" ref={threadRef}>
      {notice ? <p className="chat-notice">{notice}</p> : null}
      {messages.map((item) => {
        const mine = String(item.senderId || '').trim().toLowerCase() === String(selfId || '').trim().toLowerCase();
        const clock = formatClock(item.createdAt);
        const quote = String(item.replyTo?.text || '').trim();
        return (
          <div key={item.id} className={`chat-item${mine ? ' is-mine' : ''}`}>
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
                selfReply={mine && sameId(item.replyTo?.senderId, selfId)}
                quote={quote}
                status={mine
                  ? <ChatSendStatus item={item} lang={lang} onRetry={onRetry} peer={peer} />
                  : (clock ? <p className="chat-send-status is-in">{clock}</p> : null)}
              />
            </ChatReplySwipe>
          </div>
        );
      })}
    </div>
  );
};

export default ChatThread;
