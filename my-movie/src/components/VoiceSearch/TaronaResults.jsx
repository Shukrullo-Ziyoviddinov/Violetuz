import React from 'react';
import { useTranslation } from 'react-i18next';

const TaronaResults = ({ matches, onSelect }) => {
  const { t } = useTranslation();

  if (!matches?.length) {
    return (
      <div className="tarona-results tarona-results--empty">
        <p>{t('voiceSearch.taronaNoResults', 'Mos musiqa topilmadi')}</p>
      </div>
    );
  }

  return (
    <ul className="tarona-results" aria-label={t('voiceSearch.taronaResults', 'Natijalar')}>
      {matches.map((item) => (
        <li key={item.id}>
          <button type="button" className="tarona-results-item" onClick={() => onSelect?.(item)}>
            <span className="tarona-results-thumb-wrap">
              <img
                src={item.img || '/img/movie1.jpg'}
                alt=""
                className="tarona-results-thumb"
                loading="lazy"
              />
            </span>
            <span className="tarona-results-text">
              <span className="tarona-results-title">{item.title}</span>
              <span className="tarona-results-artist">{item.artistName || item.artistId}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
};

export default TaronaResults;
