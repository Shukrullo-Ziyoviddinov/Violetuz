import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMusicSearchHistory, removeMusicSearchHistory } from '../../utils/searchMusic';
import './SearchMusicIstoriy.css';

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SearchMusicIstoriy = ({ onItemClick }) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState(() => getMusicSearchHistory());

  const handleRemove = useCallback((e, historyId) => {
    e.stopPropagation();
    removeMusicSearchHistory(historyId);
    setHistory(getMusicSearchHistory());
  }, []);

  const handleItemClick = useCallback(
    (entry) => {
      if (onItemClick) onItemClick();
      if (entry.itemType === 'artist') {
        navigate(`/music/artist/${entry.itemId}`);
      } else if (entry.itemType === 'album') {
        navigate(`/music/album/${entry.itemId}`);
      } else if (entry.itemType === 'klip' || entry.itemType === 'konsert' || entry.itemType === 'clip') {
        navigate(`/music/video/${entry.itemId}`);
      } else {
        navigate(`/music/${entry.itemId}`);
      }
    },
    [navigate, onItemClick]
  );

  if (history.length === 0) return null;

  return (
    <div className="search-music-istoriy">
      <ul className="search-music-istoriy-list">
        {history.map((entry) => (
          <li
            key={entry.historyId}
            className="search-music-istoriy-item"
            onClick={() => handleItemClick(entry)}
          >
            <span className="search-music-istoriy-icon">
              <ClockIcon />
            </span>
            <div className="search-music-istoriy-media">
              <img
                src={entry.img || '/img/movie1.jpg'}
                alt={entry.title}
                className="search-music-istoriy-img"
              />
            </div>
            <div className="search-music-istoriy-info">
              <span className="search-music-istoriy-title">{entry.title}</span>
              {entry.artist ? (
                <>
                  <span className="search-music-istoriy-sep">–</span>
                  <span className="search-music-istoriy-artist">{entry.artist}</span>
                </>
              ) : null}
            </div>
            <button
              type="button"
              className="search-music-istoriy-remove"
              onClick={(e) => handleRemove(e, entry.historyId)}
              aria-label="O'chirish"
            >
              <CloseIcon />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchMusicIstoriy;
