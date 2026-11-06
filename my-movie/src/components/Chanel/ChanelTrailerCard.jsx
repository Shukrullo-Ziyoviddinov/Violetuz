import React from 'react';
import { Link } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import ViewCount from '../ViewCount/ViewCount';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import './ChanelTrailerCard.css';

const localized = (value, lang) => typeof value === 'string' ? value
  : value?.[lang] || value?.uz || value?.ru || Object.values(value || {}).find((item) => typeof item === 'string' && item) || '';

const TrailerInfoSkeleton = () => <div className="chanel-trailer-card-info">
  <div className="chanel-trailer-card-title" aria-hidden="true">
    <SkeletonLoader variant="block" className="chanel-trailer-card-title-skeleton" />
  </div>
  <div className="trailer-modal-meta-row chanel-trailer-card-meta" aria-hidden="true">
    <div className="view-count-text view-count-text--loading">
      <SkeletonLoader variant="view-count-text" />
    </div>
  </div>
</div>;

export const ChanelTrailerCardSkeleton = ({ layout = 'row' }) => (
  <div className={`chanel-trailer-card chanel-trailer-card--${layout}`} aria-hidden="true">
    <div className="chanel-trailer-card-preview">
      <SkeletonLoader variant="music-cards-image" className="chanel-trailer-card-skeleton" />
    </div>
    <TrailerInfoSkeleton />
  </div>
);

export default function ChanelTrailerCard({ item, layout = 'row' }) {
  const { contentLang } = useContentLanguage();
  const source = item.trillerimg || '';
  const title = localized(item.title, contentLang) || localized(item.movieTitle, contentLang);
  const { showSkeleton: loading, imgRef, onLoad, onError, failed } = useImageReady(source);

  return (
    <Link className={`chanel-trailer-card chanel-trailer-card--${layout}`} aria-busy={loading || undefined} to={`/movie/${encodeURIComponent(item.movieId)}/trailer?trailerId=${encodeURIComponent(item.id)}`}>
      <div className="chanel-trailer-card-preview">
        {loading && <SkeletonLoader variant="music-cards-image" className="chanel-trailer-card-skeleton" />}
        {!failed && source && <img
          ref={imgRef}
          key={source}
          src={source}
          alt={title}
          decoding="async"
          className={loading ? 'is-loading' : ''}
          onLoad={onLoad}
          onError={onError}
        />}
        {!loading && <span className="chanel-trailer-card-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9z" /></svg>
        </span>}
      </div>
      {loading ? <TrailerInfoSkeleton /> : <div className="chanel-trailer-card-info">
        <h3 className="chanel-trailer-card-title">{title}</h3>
        <div className="trailer-modal-meta-row chanel-trailer-card-meta">
          <ViewCount itemId={`${item.movieId}-${item.id}`} type="trailer" variant="text" record={false} className="view-count-text trailer-modal-view-count" />
        </div>
      </div>}
    </Link>
  );
}
