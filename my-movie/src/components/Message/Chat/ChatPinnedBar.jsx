import React, { useEffect, useRef, useState } from 'react';
import ChatGif from './ChatGif';
import ChatLottie from './ChatLottie';
import { emojiOnlyCount } from './chatEmojis';
import './ChatPinnedBar.css';

const previewOf = (item) => {
  if (item?.gif) return 'gif';
  if (item?.animationId) return 'anim';
  if (emojiOnlyCount(item?.text)) return 'emoji';
  return 'text';
};

const ChatPinnedBar = ({ pins, lang, onJump }) => {
  const items = Array.isArray(pins) ? pins : [];
  const key = items.map((item) => item.id).join('|');
  const [active, setActive] = useState(0);
  const advanceRef = useRef(false);

  useEffect(() => {
    setActive(0);
    advanceRef.current = false;
  }, [key]);

  if (!items.length) return null;
  const index = ((active % items.length) + items.length) % items.length;
  const current = items[index];
  const kind = previewOf(current);
  const label = lang === 'ru' ? 'Закреплённое сообщение' : 'Qadalgan xabar';
  const text = String(current.text || '').replace(/\s+/g, ' ').trim();

  const jump = () => {
    const next = advanceRef.current ? (index + 1) % items.length : index;
    advanceRef.current = true;
    setActive(next);
    onJump?.(items[next].id);
  };

  return (
    <button type="button" className="chat-pin" onClick={jump}>
      <span className="chat-pin-head">
        <svg className="chat-pin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M9 4.2h6l-.8 5.2 2.6 2.4H7.2L9.8 9.4 9 4.2Z" strokeLinejoin="round" />
          <path d="M12 11.8V20" strokeLinecap="round" />
        </svg>
        <strong>{label}</strong>
      </span>
      <span className="chat-pin-body">
        {kind === 'gif' ? (
          <ChatGif className="chat-pin-gif" file={current.gif} label={text} fit max={40} />
        ) : null}
        {kind === 'anim' ? (
          <ChatLottie className="chat-pin-anim" id={current.animationId} label={text} />
        ) : null}
        {kind === 'emoji' || kind === 'text' ? (
          <span className={`chat-pin-text${kind === 'emoji' ? ' is-emoji' : ''}`}>{text}</span>
        ) : null}
      </span>
      {items.length > 1 ? (
        <span className="chat-pin-dots" aria-hidden="true">
          {items.map((item, dot) => (
            <span key={item.id} className={`chat-pin-dot${dot === index ? ' is-active' : ''}`} />
          ))}
        </span>
      ) : null}
    </button>
  );
};

export default ChatPinnedBar;
