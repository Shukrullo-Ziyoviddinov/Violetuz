import React from 'react';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import './ComentariaHistoryFilter.css';

const FILTERS = [
  { id: 'all', uz: 'Hammasi', ru: 'Все' },
  { id: 'movie', uz: 'Kino', ru: 'Кино' },
  { id: 'klip', uz: 'Klip', ru: 'Клипы' },
  { id: 'konsert', uz: 'Konsert', ru: 'Концерты' },
  { id: 'shorts', uz: 'Shorts', ru: 'Шорты' },
];

const ComentariaHistoryFilter = ({ active, onChange, lang = 'uz' }) => {
  return (
    <div className="comentaria-history-filter">
      <ScrollTouch
        className="comentaria-history-filter-scroll"
        role="tablist"
        aria-label={lang === 'ru' ? 'Фильтр комментариев' : 'Sharhlar filtri'}
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={active === f.id}
            className={`comentaria-history-filter-btn ${active === f.id ? 'is-active' : ''}`}
            onClick={() => onChange(f.id)}
          >
            {lang === 'ru' ? f.ru : f.uz}
          </button>
        ))}
      </ScrollTouch>
    </div>
  );
};

export default ComentariaHistoryFilter;
