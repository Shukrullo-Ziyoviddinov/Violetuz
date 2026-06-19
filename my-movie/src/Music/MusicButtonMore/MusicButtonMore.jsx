import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MusicButtonMore.css';

const MusicButtonMore = ({ to = '/music/more' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(to);
  };

  return (
    <div
      className="music-button-more music-cards-item"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label="Ko'proq ko'rish"
      data-allow-navigate
    >
      <div className="music-button-more-wrapper music-cards-item-image-wrapper">
        <span className="music-button-more-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </div>
    </div>
  );
};

export default MusicButtonMore;
