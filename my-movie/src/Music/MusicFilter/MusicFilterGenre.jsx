import React, { useState, useRef, useEffect } from 'react';
import './MusicFilter.css';

const MusicFilterGenre = ({ options = [], value, onChange, label = 'Genre' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const displayValue = value === null || value === '' || value === 'all' ? 'All' : String(value);

  return (
    <div className="music-filter-item" ref={wrapRef}>
      <button
        type="button"
        className={`music-filter-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((v) => !v)}
      >
        <span className="music-filter-label">{label}:</span>
        <span className="music-filter-value">{displayValue}</span>
        <svg className="music-filter-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>
      {isOpen && (
        <div className="music-filter-dropdown">
          <button
            type="button"
            className={`music-filter-option ${(!value || value === 'all') ? 'active' : ''}`}
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
          >
            All
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`music-filter-option ${(value && opt && String(value).toLowerCase() === String(opt).toLowerCase()) ? 'active' : ''}`}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MusicFilterGenre;
