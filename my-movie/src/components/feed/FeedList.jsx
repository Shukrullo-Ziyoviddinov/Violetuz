import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FeedItem from './FeedItem';
import './FeedList.css';

const FeedList = ({ items }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!items.length) {
    return (
      <div className="feed-list-empty">
        <img
          className="feed-list-empty-img"
          src="/img/feedImg_preview_rev_2.png"
          alt=""
          decoding="async"
        />
        <p className="feed-list-empty-text">{t('feed.emptyDescription')}</p>
        <div className="feed-list-empty-actions">
          <button
            type="button"
            className="feed-list-empty-btn"
            onClick={() => navigate('/')}
          >
            {t('wishlist.tabMovies')}
          </button>
          <button
            type="button"
            className="feed-list-empty-btn feed-list-empty-btn--music"
            onClick={() => navigate('/music')}
          >
            {t('navbar.music')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-list">
      {items.map((item) => (
        <FeedItem key={item.id} item={item} />
      ))}
    </div>
  );
};

export default FeedList;
