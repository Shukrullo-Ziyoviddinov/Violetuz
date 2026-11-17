import React, { useEffect, useRef } from 'react';
import ChatMessageBlock from './ChatMessageBlock';

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

const formatClock = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const sendCopy = (lang) => (lang === 'ru'
  ? { sending: 'Отправляется', failed: 'Не отправлено', retry: 'Повторить', delivered: 'Доставлено' }
  : { sending: 'Yuborilmoqda', failed: 'Yuborilmadi', retry: 'Qayta urinish', delivered: 'Yetkazildi' });

const ChatSendStatus = ({ item, lang, onRetry }) => {
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
  return (
    <p className="chat-send-status">
      <span>{clock ? `${clock} · ${copy.delivered}` : copy.delivered}</span>
      {checkIcon}
    </p>
  );
};

const ChatThread = ({ messages, selfId, notice, typing, lang, onRetry }) => {
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
        return (
          <div key={item.id} className={`chat-item${mine ? ' is-mine' : ''}`}>
            <ChatMessageBlock text={item.text} mine={mine} />
            {mine ? <ChatSendStatus item={item} lang={lang} onRetry={onRetry} /> : null}
          </div>
        );
      })}
    </div>
  );
};

export default ChatThread;
