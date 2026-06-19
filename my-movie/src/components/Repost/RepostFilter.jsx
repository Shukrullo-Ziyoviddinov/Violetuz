import React from 'react';
import { useTranslation } from 'react-i18next';
import { REPOST_UI_FILTERS } from './repostTypes';
import './RepostFilter.css';

const RepostFilter = ({ activeFilter, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className="repost-filter">
      {REPOST_UI_FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          className={`repost-filter-btn ${activeFilter === f.id ? 'active' : ''}`}
          onClick={() => onChange(f.id)}
        >
          <i className={`fa-solid ${f.icon}`} aria-hidden="true" />
          <span>{t(`profilePage.repostFilters.${f.id}`)}</span>
        </button>
      ))}
    </div>
  );
};

export default RepostFilter;
