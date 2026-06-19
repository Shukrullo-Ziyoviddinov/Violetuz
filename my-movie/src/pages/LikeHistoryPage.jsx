import React, { useEffect, useMemo, useState } from 'react';
import LikeHistory from '../components/LikeHistory/LikeHistory';
import LikeHistoryFilter from '../components/LikeHistory/LikeHistoryFilter';
import { useLikeHistory } from '../context/LikesContext';
import './LikeHistoryPage.css';

const LikeHistoryPage = () => {
  const [filter, setFilter] = useState('movie');
  const list = useLikeHistory();

  useEffect(() => {
    const available = new Set(list.map((item) => item.category));
    if (!available.size) return;
    if (!available.has(filter)) {
      if (available.has('movie')) setFilter('movie');
      else if (available.has('clip')) setFilter('clip');
      else if (available.has('concert')) setFilter('concert');
    }
  }, [list, filter]);

  const filtered = useMemo(() => list.filter((item) => item.category === filter), [list, filter]);

  return (
    <div className="like-history-page">
      <div className="like-history-page-container">
        <LikeHistoryFilter active={filter} onChange={setFilter} items={list} />
        <LikeHistory items={filtered} activeCategory={filter} />
      </div>
    </div>
  );
};

export default LikeHistoryPage;
