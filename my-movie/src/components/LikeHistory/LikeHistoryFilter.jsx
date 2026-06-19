import React from 'react';
import './LikeHistoryFilter.css';

const FILTERS = [
  { id: 'movie', label: 'Kinolar' },
  { id: 'clip', label: 'Kliplar' },
  { id: 'concert', label: 'Konsertlar' },
];

const LikeHistoryFilter = ({ active = 'movie', onChange, items = [] }) => {
  const available = new Set(items.map((item) => item.category));
  return (
    <div className="like-history-filter">
      {FILTERS.filter((filter) => available.has(filter.id)).map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={`like-history-filter-btn ${active === filter.id ? 'active' : ''}`}
          onClick={() => onChange?.(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default LikeHistoryFilter;
