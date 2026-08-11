import React from 'react';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import './MediaGenreFilter.css';

/**
 * Faqat datada mavjud trillerGenre qiymatlarini chip qilib chiqaradi.
 * ≤900px sticky pin ichida ko‘rinadi. Gorizontal scroll — ScrollTouch.
 */
const MediaGenreFilter = ({ genres = [], selectedId = 'all', onSelect }) => {
  const { t } = useTranslation();

  if (!genres.length) return null;

  return (
    <div className="media-genre-filter-wrap" role="tablist" aria-label={t('triller.forYou', 'Sizga yoqadi')}>
      <ScrollTouch className="media-genre-filter">
        <button
          type="button"
          role="tab"
          aria-selected={selectedId === 'all'}
          className={`media-genre-filter-chip${selectedId === 'all' ? ' is-active' : ''}`}
          onClick={() => onSelect?.('all')}
        >
          {t('triller.filterAll', 'Barchasi')}
        </button>
        {genres.map((genre) => (
          <button
            type="button"
            key={genre.id}
            role="tab"
            aria-selected={selectedId === genre.id}
            className={`media-genre-filter-chip${selectedId === genre.id ? ' is-active' : ''}`}
            onClick={() => onSelect?.(genre.id)}
          >
            {genre.label}
          </button>
        ))}
      </ScrollTouch>
    </div>
  );
};

export default MediaGenreFilter;
