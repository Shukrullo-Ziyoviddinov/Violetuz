import React from 'react';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../../components/ScrollTouch/ScrollTouch';
import './MusicVideoGenreFilter.css';

/**
 * Video detail (klip/konsert) mobil sticky filter.
 * Faqat joriy categoryNameMusic bo‘limidagi mavjud genre qiymatlari.
 */
const MusicVideoGenreFilter = ({ genres = [], selectedId = 'all', onSelect }) => {
  const { t } = useTranslation();

  if (!genres.length) return null;

  return (
    <div
      className="music-video-genre-filter-wrap"
      role="tablist"
      aria-label={t('music.genreFilter', 'Janr filter')}
    >
      <ScrollTouch className="music-video-genre-filter">
        <button
          type="button"
          role="tab"
          aria-selected={selectedId === 'all'}
          className={`music-video-genre-filter-chip${selectedId === 'all' ? ' is-active' : ''}`}
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
            className={`music-video-genre-filter-chip${
              selectedId === genre.id ? ' is-active' : ''
            }`}
            onClick={() => onSelect?.(genre.id)}
          >
            {genre.label}
          </button>
        ))}
      </ScrollTouch>
    </div>
  );
};

export default MusicVideoGenreFilter;
