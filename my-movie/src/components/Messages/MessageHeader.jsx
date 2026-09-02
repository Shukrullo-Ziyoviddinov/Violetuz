import React from 'react';
import MessageSearch from './MessageSearch';
import './MessageHeader.css';

const BackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const MessageHeader = ({ onClose, onOpenSearch }) => {
  return (
    <header className="message-header">
      <button type="button" className="message-header-back" onClick={onClose} aria-label="Закрыть">
        <BackIcon />
      </button>
      <h2 id="message-modal-title" className="message-header-title">
        Переписки
      </h2>
      <div className="message-header-actions">
        <MessageSearch onOpenSearch={onOpenSearch} />
      </div>
    </header>
  );
};

export default MessageHeader;
