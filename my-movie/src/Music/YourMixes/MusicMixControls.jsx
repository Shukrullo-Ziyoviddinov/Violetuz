import React from 'react';
import './MusicMixControls.css';

const MusicMixControls = ({ repeat, shuffle, onToggleRepeat, onToggleShuffle }) => (
  <div className="music-mix-controls">
    <button
      type="button"
      className={repeat ? 'is-on' : ''}
      onClick={onToggleRepeat}
      aria-pressed={repeat}
      aria-label="Qayta"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
      </svg>
    </button>
    <button
      type="button"
      className={shuffle ? 'is-on' : ''}
      onClick={onToggleShuffle}
      aria-pressed={shuffle}
      aria-label="Aralash"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
        />
      </svg>
    </button>
    <button type="button" className="music-mix-controls-more" aria-label="Yana">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
        />
      </svg>
    </button>
  </div>
);

export default MusicMixControls;
