import React from 'react';
import './LikeHistoryFilter.css';
import { LIKE_HISTORY_FILTERS } from '../LikeHistoryPageFilter/likeHistoryFilterLogic';

/**
 * Desktop like-history kategoriya filtri.
 * Mobil: yashirin — o‘rniga LikeHistoryFilterModal + mobile bar.
 */
const LikeHistoryFilter = ({ active = 'movie', onChange, items = [] }) => {
  const available = new Set(items.map((item) => item.category));
  return (
    <div className="like-history-filter like-history-filter--desktop">
      {LIKE_HISTORY_FILTERS.filter((filter) => available.has(filter.id)).map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={`like-history-filter-btn ${active === filter.id ? 'active' : ''}`}
          onClick={() => onChange?.(filter.id)}
        >
          {filter.fallback}
        </button>
      ))}
    </div>
  );
};

export default LikeHistoryFilter;
