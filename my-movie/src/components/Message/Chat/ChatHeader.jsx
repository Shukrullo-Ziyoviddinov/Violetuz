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
      <span className="chat-header-avatar" aria-hidden="true">
        <UserAvatar
          src={peer?.avatar}
          className="chat-header-avatar-img"
          fallback={<span>{initialsOf(name)}</span>}
        />
      </span>
      <span className="chat-header-text">
        <span className="chat-header-name">{name}</span>
        {name ? <span className="chat-header-status">{peer?.onlineLabel || ''}</span> : null}
      </span>
    </header>
  );
};

export default ChatHeader;
