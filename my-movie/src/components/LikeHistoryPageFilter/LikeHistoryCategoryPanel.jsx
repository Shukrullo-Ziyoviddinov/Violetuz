import React from 'react';
import { useTranslation } from 'react-i18next';
import { LikeHistoryTabIcons } from './likeHistoryTabIcons';
import { countLikeHistoryByCategory } from './likeHistoryFilterLogic';

/**
 * Like-history mobil modal paneli — tanlangan kategoriya (kino / klip / konsert).
 */
const LikeHistoryCategoryPanel = ({ category, items = [] }) => {
  const { t } = useTranslation();
  const count = countLikeHistoryByCategory(items, category);

  const title =
    category === 'movie'
      ? t('likeHistory.tabMovies', 'Kinolar')
      : category === 'clip'
        ? t('likeHistory.tabClips', 'Kliplar')
        : t('likeHistory.tabConcerts', 'Konsertlar');

  const hint =
    category === 'movie'
      ? t('likeHistory.panelMoviesHint', 'Like bosilgan kinolar')
      : category === 'clip'
        ? t('likeHistory.panelClipsHint', 'Like bosilgan kliplar')
        : t('likeHistory.panelConcertsHint', 'Like bosilgan konsertlar');

  return (
    <div className="like-history-filter-panel like-history-filter-panel--category">
      <div className="like-history-filter-section">
        <h4 className="like-history-filter-section-title">{title}</h4>
        <div className="like-history-filter-panel-summary">
          <span className="like-history-filter-panel-summary-icon" aria-hidden="true">
            {LikeHistoryTabIcons[category]}
          </span>
          <div className="like-history-filter-panel-summary-text">
            <p className="like-history-filter-panel-summary-hint">{hint}</p>
            <p className="like-history-filter-panel-summary-count">
              {t('likeHistory.panelCount', '{{count}} ta', { count })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LikeHistoryCategoryPanel;
