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
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle cx="8.6" cy="8.2" r="2.35" fill="#fff" />
              <circle cx="12.1" cy="6.5" r="2.45" fill="#fff" />
              <circle cx="15.2" cy="8.6" r="2.15" fill="#fff" />
              <circle cx="11.2" cy="10.1" r="1.7" fill="#fff" />
              <rect x="14.2" y="3.1" width="5.2" height="5.2" rx="1.4" fill="#22c55e" />
              <path fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" d="M6.8 11.4h10.4l-1.35 8.3H8.15L6.8 11.4z" />
              <path fill="none" stroke="#fff" strokeWidth="1.3" d="M12 11.6v7.7" />
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
