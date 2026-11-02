import React, { useState } from 'react';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import './ChanelTypeFilter.css';

const CHANNEL_TYPES = [
  { id: 'all', label: 'Hammasi' },
  { id: 'movies', label: 'Kinolar' },
  { id: 'videos', label: 'Videolar' },
  { id: 'shorts', label: 'Shortslar' },
  { id: 'playlists', label: 'Playlistlar' },
  { id: 'posts', label: 'Postlar' },
];

const ChanelTypeFilter = ({ value, onChange }) => {
  const [internalValue, setInternalValue] = useState('all');
  const selected = value ?? internalValue;

  const select = (id) => {
    if (value === undefined) setInternalValue(id);
    onChange?.(id);
  };

  return (
    <div className="chanel-type-bar">
      <ScrollTouch className="chanel-type-filter" role="tablist" aria-label="Kanal turlari">
        {CHANNEL_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            role="tab"
            aria-selected={selected === type.id}
            className={`chanel-type-filter-chip${selected === type.id ? ' is-active' : ''}`}
            onClick={() => select(type.id)}
          >
            {type.label}
          </button>
        ))}
      </ScrollTouch>
      <label className="chanel-type-search">
        <input type="text" aria-label="Qidirish" placeholder="Qidirish..." />
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
      </label>
    </div>
  );
};

export default ChanelTypeFilter;
