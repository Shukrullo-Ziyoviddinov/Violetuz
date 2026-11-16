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
        <span className="chat-header-delete" aria-hidden="true">
          <i className="fa-solid fa-trash" />
          <span className="chat-header-delete-dot" />
        </span>
      ) : null}
    </header>
  );
};

export default ChatHeader;
