import React from 'react';
import './MessageSearch.css';

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
  </svg>
);

const MessageSearch = ({ onOpenSearch }) => {
  return (
    <button
      type="button"
      className="message-search-btn"
      onClick={onOpenSearch}
      aria-label="Поиск пользователей"
    >
      <SearchIcon />
    </button>
  );
};

export default MessageSearch;
