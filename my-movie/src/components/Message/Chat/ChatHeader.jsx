import React from 'react';
import UserAvatar from '../../UserAvatar/UserAvatar';

const initialsOf = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const ChatHeader = ({ peer, onBack, lang }) => {
  const name = peer?.name || '';

  return (
    <header className="chat-header">
      <button type="button" className="chat-back" onClick={onBack} aria-label={lang === 'ru' ? 'Назад' : 'Orqaga'}>
        ‹
      </button>
      {name ? (
        <span className="chat-header-person">
          <span className="chat-header-avatar" aria-hidden="true">
            <span className="chat-header-avatar-face">
              <UserAvatar
                src={peer?.avatar}
                className="chat-header-avatar-img"
                fallback={<span>{initialsOf(name)}</span>}
              />
            </span>
            <span className="chat-header-dot" />
          </span>
          <span className="chat-header-text">
            <span className="chat-header-name">{name}</span>
            <span className="chat-header-status">{peer?.onlineLabel || ''}</span>
          </span>
        </span>
      ) : null}
      {name ? (
        <span className="chat-header-tools">
          <span className="chat-header-popcorn" aria-hidden="true">
            <svg width="42" height="42" viewBox="0 0 32 32">
              <path
                fill="none"
                stroke="#fff"
                strokeWidth="1.7"
                strokeLinecap="round"
                d="M6.2 14.2c.2-2.8 2.2-4 3.6-2 .4-2.8 3.4-3.4 4.6-.4 1.2-2.4 4-1.8 4.2 1.2 1.8-1.1 3.6.6 3.2 2.6"
              />
              <path
                fill="none"
                stroke="#fff"
                strokeWidth="1.7"
                strokeLinejoin="round"
                d="M5.4 15.2h21.2L24.2 29.2H7.8L5.4 15.2z"
              />
              <path fill="none" stroke="#fff" strokeWidth="1.5" d="M16 15.4V28.6" />
              <rect x="19.6" y="5.2" width="7.6" height="7.2" rx="2" fill="#22c55e" />
            </svg>
          </span>
          <span className="chat-header-more" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#d4ceea">
              <circle cx="12" cy="5" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="12" cy="19" r="1.7" />
            </svg>
          </span>
        </span>
      ) : null}
    </header>
  );
};

export default ChatHeader;
