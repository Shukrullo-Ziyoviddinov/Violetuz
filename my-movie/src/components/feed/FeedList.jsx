import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FeedItem from './FeedItem';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import './FeedList.css';

const EMPTY_IMG_SRC = '/img/feedImg_preview_rev_2.png';

const FeedListEmptySkeleton = () => (
  <div className="feed-list-empty" aria-busy="true">
    <div className="feed-list-empty-img feed-list-empty-img--skeleton" aria-hidden="true">
      <SkeletonLoader variant="feed-list-empty-img" />
    </div>
    <div className="feed-list-empty-text feed-list-empty-text--skeleton" aria-hidden="true">
      <SkeletonLoader variant="feed-list-empty-text" />
    </div>
    <div className="feed-list-empty-actions" aria-hidden="true">
      <div className="feed-list-empty-btn feed-list-empty-btn--skeleton">
        <SkeletonLoader variant="feed-list-empty-btn" />
      </div>
      <div className="feed-list-empty-btn feed-list-empty-btn--music feed-list-empty-btn--skeleton">
        <SkeletonLoader variant="feed-list-empty-btn" />
      </div>
    </div>
  </div>
);

const FeedListEmpty = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showSkeleton: showImgSkeleton, imgRef, onLoad, onError } = useImageReady(EMPTY_IMG_SRC);

  if (showImgSkeleton) {
    return <FeedListEmptySkeleton />;
  }

  return (
    <div className="feed-list-empty">
      <img
        ref={imgRef}
        className="feed-list-empty-img"
        src={EMPTY_IMG_SRC}
        alt=""
        decoding="async"
        onLoad={onLoad}
        onError={onError}
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
};

const FeedList = ({ items, loading = false }) => {
  if (loading && !items.length) {
    return <FeedListEmptySkeleton />;
  }

  if (!items.length) {
    return <FeedListEmpty />;
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
