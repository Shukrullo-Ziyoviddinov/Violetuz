import React from 'react';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import { SEARCH_FILTER_ALL } from '../../utils/searchFilterTypes';
import './FilterSearchRezult.css';

/**
 * Search modal natijalari ustidagi gorizontal filter.
 * Faqat natijada mavjud bo'lgan turlar chiqadi.
 */
const FilterSearchRezult = ({ filters = [], activeFilter = SEARCH_FILTER_ALL, onSelect }) => {
  const { t } = useTranslation();

  if (!filters.length) return null;

  return (
    <div
      className="filter-search-rezult-wrap"
      role="tablist"
      aria-label={t('searchModal.resultFilter', 'Natija filteri')}
    >
      <ScrollTouch className="filter-search-rezult">
        <button
          type="button"
          role="tab"
          aria-selected={activeFilter === SEARCH_FILTER_ALL}
          className={`filter-search-rezult-chip${activeFilter === SEARCH_FILTER_ALL ? ' is-active' : ''}`}
          onClick={() => onSelect?.(SEARCH_FILTER_ALL)}
        >
          {t('searchModal.filterAll', 'Barchasi')}
        </button>
        {filters.map((filter) => (
          <button
            type="button"
            key={filter.id}
            role="tab"
            aria-selected={activeFilter === filter.id}
            className={`filter-search-rezult-chip${activeFilter === filter.id ? ' is-active' : ''}`}
            onClick={() => onSelect?.(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </ScrollTouch>
    </div>
  );
};

export default FilterSearchRezult;
