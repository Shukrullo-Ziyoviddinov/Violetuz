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

const FEED_SKELETON_KINDS = {
  all: ['movie', 'klip', 'music', 'konsert', 'movie', 'music', 'klip', 'movie'],
  movie: ['movie', 'movie', 'movie', 'movie', 'movie', 'movie'],
  music: ['music', 'music', 'music', 'music', 'music', 'music'],
  klip: ['klip', 'klip', 'klip', 'klip', 'klip', 'klip'],
  konsert: ['konsert', 'konsert', 'konsert', 'konsert', 'konsert', 'konsert'],
};

const FeedProfileSkeleton = ({ prefix, verifiedClass }) => (
  <div className={`${prefix}-profile`}>
    <div className={`${prefix}-avatar ${prefix}-avatar--skeleton`}>
      <SkeletonLoader variant="feed-card-avatar" />
    </div>
    <div className={`${prefix}-profile-text`}>
      <div className={`${prefix}-name`}>
        <span className={`${prefix}-name-text`}>
          <SkeletonLoader variant="feed-card-name" />
        </span>
        <span className={`${verifiedClass} ${verifiedClass}--skeleton`}>
          <SkeletonLoader variant="feed-card-verified" />
        </span>
      </div>
      <div className={`${prefix}-type`}>
        <SkeletonLoader variant="feed-card-type" />
      </div>
    </div>
  </div>
);

const FeedMetaRowSkeleton = ({ rowClass, viewClass }) => (
  <div className={rowClass}>
    <span className={`view-count-text ${viewClass}`}>
      <SkeletonLoader variant="feed-card-view-count" />
    </span>
    <span className={`uploaded-at-time ${rowClass.replace('-meta-row', '-uploaded-at')}`}>
      <SkeletonLoader variant="feed-card-uploaded-at" />
    </span>
  </div>
);

const FeedMovieCardSkeleton = () => (
  <div className="feed-movie-card feed-movie-card--skeleton" aria-hidden="true">
    <FeedProfileSkeleton prefix="feed-movie-card" verifiedClass="feed-movie-card-name-verified" />
    <div className="feed-movie-card-cover feed-movie-card-cover--skeleton">
      <SkeletonLoader variant="feed-movie-card-cover" />
    </div>
    <h3 className="feed-movie-card-title">
      <SkeletonLoader variant="feed-movie-card-title" />
    </h3>
    <p className="feed-movie-card-movie-meta">
      <SkeletonLoader variant="feed-movie-card-movie-meta" />
    </p>
    <FeedMetaRowSkeleton rowClass="feed-movie-card-meta-row" viewClass="feed-movie-card-view-count" />
    <div className="feed-movie-card-actions">
      <div className="feed-movie-card-actions-like-group">
        <SkeletonLoader variant="feed-card-chip" />
        <SkeletonLoader variant="feed-card-chip-short" />
        <SkeletonLoader variant="feed-card-chip-short" />
      </div>
      <SkeletonLoader variant="feed-card-fav" />
    </div>
  </div>
);

const FeedVideoCardSkeleton = () => (
  <div className="feed-video-card feed-video-card--skeleton" aria-hidden="true">
    <FeedProfileSkeleton prefix="feed-video-card" verifiedClass="feed-artist-name-verified" />
    <div className="feed-video-card-media-wrap">
      <div className="feed-video-card-cover feed-video-card-cover--skeleton">
        <SkeletonLoader variant="feed-video-card-cover" />
      </div>
      <div className="feed-video-card-badge feed-video-card-badge--skeleton">
        <SkeletonLoader variant="feed-video-card-badge" />
      </div>
    </div>
    <div className="feed-video-card-info video-detail-info">
      <span className="video-detail-title">
        <SkeletonLoader variant="feed-video-card-title" />
      </span>
      <span className="video-detail-artist-name">
        <SkeletonLoader variant="feed-video-card-artist" />
      </span>
      <FeedMetaRowSkeleton rowClass="feed-video-card-meta-row" viewClass="feed-video-card-view-count" />
    </div>
    <div className="feed-video-card-actions">
      <div className="feed-video-card-actions-like-group">
        <SkeletonLoader variant="feed-card-chip" />
        <SkeletonLoader variant="feed-card-chip-short" />
        <SkeletonLoader variant="feed-card-chip-short" />
      </div>
      <SkeletonLoader variant="feed-card-fav" />
    </div>
  </div>
);

const FeedMusicCardSkeleton = () => (
  <div className="feed-music-card feed-music-card--skeleton" aria-hidden="true">
    <FeedProfileSkeleton prefix="feed-music-card" verifiedClass="feed-artist-name-verified" />
    <div className="feed-music-card-track">
      <div className="feed-music-card-cover feed-music-card-cover--skeleton">
        <SkeletonLoader variant="feed-music-card-cover" />
      </div>
      <div className="feed-music-card-track-info">
        <div className="feed-music-card-artist">
          <SkeletonLoader variant="feed-music-card-artist" />
        </div>
        <div className="feed-music-card-track-name">
          <SkeletonLoader variant="feed-music-card-track-name" />
        </div>
        <div className="feed-music-card-duration">
          <SkeletonLoader variant="feed-music-card-duration" />
        </div>
      </div>
      <div className="feed-music-card-play feed-music-card-play--skeleton">
        <SkeletonLoader variant="feed-music-card-play" />
      </div>
    </div>
    <div className="feed-music-card-actions">
      <div className="feed-music-card-views-row feed-music-card-views-row--skeleton">
        <SkeletonLoader variant="feed-card-chip" />
      </div>
      <SkeletonLoader variant="feed-card-chip-short" />
      <SkeletonLoader variant="feed-card-fav" />
    </div>
  </div>
);

const FeedCardSkeleton = ({ kind }) => {
  if (kind === 'music') return <FeedMusicCardSkeleton />;
  if (kind === 'movie') return <FeedMovieCardSkeleton />;
  return <FeedVideoCardSkeleton />;
};

const FeedList = ({ items, loading = false, category = 'all' }) => {
  if (loading && !items.length) {
    const kinds = FEED_SKELETON_KINDS[category] || FEED_SKELETON_KINDS.all;
    return (
      <div className="feed-list" aria-busy="true" aria-label="Yuklanmoqda">
        {kinds.map((kind, index) => (
          <FeedCardSkeleton key={`${kind}-${index}`} kind={kind} />
        ))}
      </div>
    );
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
