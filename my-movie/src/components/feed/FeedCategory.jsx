import React from 'react';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import './FeedCategory.css';

const categories = [
  { id: 'all', labelKey: 'feed.categories.all', icon: 'fa-layer-group' },
  { id: 'music', labelKey: 'feed.categories.music', icon: 'fa-music' },
  { id: 'movie', labelKey: 'feed.categories.movie', icon: 'fa-film' },
  { id: 'klip', labelKey: 'feed.categories.klip', icon: 'fa-circle-play' },
  { id: 'konsert', labelKey: 'feed.categories.konsert', icon: 'fa-microphone-lines' },
];

const FeedCategory = ({ activeCategory, onChangeCategory, onOpenMessages }) => {
  const { t } = useTranslation();

  return (
    <div className="feed-category-wrap">
      <ScrollTouch className="feed-category">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`feed-category-btn ${activeCategory === category.id ? 'feed-category-btn--active' : ''}`}
            onClick={() => onChangeCategory(category.id)}
          >
            <i className={`fa-solid ${category.icon} feed-category-btn-icon`} aria-hidden="true" />
            <span>{t(category.labelKey)}</span>
          </button>
        ))}
        <button type="button" className="feed-category-messages-entry" onClick={onOpenMessages}>
          <i className="fa-solid fa-comments feed-category-messages-entry-icon" aria-hidden="true" />
          <span>{t('feed.messages')}</span>
        </button>
      </ScrollTouch>
    </div>
  );
};

export default FeedCategory;
