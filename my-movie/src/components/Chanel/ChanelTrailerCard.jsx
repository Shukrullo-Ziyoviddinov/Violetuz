import React from 'react';
import { Link } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import ViewCount from '../ViewCount/ViewCount';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import './ChanelTrailerCard.css';

const localized = (value, lang) => typeof value === 'string' ? value
  : value?.[lang] || value?.uz || value?.ru || Object.values(value || {}).find((item) => typeof item === 'string' && item) || '';

export default function ChanelTrailerCard({ item, layout = 'row' }) {
  const { contentLang } = useContentLanguage();
  const source = item.trillerimg || '';
  const title = localized(item.title, contentLang) || localized(item.movieTitle, contentLang);
  const { showSkeleton: loading, imgRef, onLoad, onError, failed } = useImageReady(source);

  return (
    <Link className={`chanel-trailer-card chanel-trailer-card--${layout}`} to={`/movie/${encodeURIComponent(item.movieId)}/trailer?trailerId=${encodeURIComponent(item.id)}`}>
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
        <span className="chanel-trailer-card-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9z" /></svg>
        </span>
      </div>
      <div className="chanel-trailer-card-info">
        <h3>{title}</h3>
        <div className="trailer-modal-meta-row chanel-trailer-card-meta">
          <ViewCount itemId={`${item.movieId}-${item.id}`} type="trailer" variant="text" record={false} className="view-count-text trailer-modal-view-count" />
        </div>
      </div>
    </Link>
  );
}
