import React from 'react';
import UserAvatar from '../../UserAvatar/UserAvatar';
import { normalizeUsername } from '../../../store/slices/userUtils';

const initialsOf = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const ChatHeader = ({ peer, onBack, lang }) => {
  const name = peer?.name || '';
  const username = normalizeUsername(peer?.username);
  const usernameLabel = username ? `@${username}` : '';

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
            {usernameLabel ? <span className="chat-header-username">{usernameLabel}</span> : null}
          </span>
        </span>
      ) : null}
      {name ? (
        <span className="chat-header-tools">
          <span className="chat-header-popcorn" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a2 2 0 0 0 0-4 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0 0 4" />
              <path d="M10 22 9 8" />
              <path d="m14 22 1-14" />
              <path d="M20 8c.5 0 .9.4.8 1l-2.6 12c-.1.5-.7 1-1.2 1H7c-.6 0-1.1-.4-1.2-1L3.2 9c-.1-.6.3-1 .8-1Z" />
            </svg>
          </span>
          <span className="chat-header-more" aria-hidden="true">
            <i className="fa-solid fa-ellipsis-vertical" />
          </span>
        </span>
      ) : null}
    </header>
  );
};

export default ChatHeader;
