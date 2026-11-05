import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import ViewCount from '../ViewCount/ViewCount';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import './ChanelTrailerCard.css';

const localized = (value, lang) => typeof value === 'string' ? value
  : value?.[lang] || value?.uz || value?.ru || Object.values(value || {}).find((item) => typeof item === 'string' && item) || '';

export default function ChanelTrailerCard({ item, layout = 'row' }) {
  const { contentLang } = useContentLanguage();
  const source = localized(item.trailers, contentLang);
  const title = localized(item.title, contentLang) || localized(item.movieTitle, contentLang);
  const [settledSource, setSettledSource] = useState('');
  const loading = source && settledSource !== source;

  return (
    <Link className={`chanel-trailer-card chanel-trailer-card--${layout}`} to={`/movie/${encodeURIComponent(item.movieId)}/trailer?trailerId=${encodeURIComponent(item.id)}`}>
      <div className="chanel-trailer-card-preview">
        {loading && <SkeletonLoader variant="music-cards-image" className="chanel-trailer-card-skeleton" />}
        <video
          key={source}
          src={source}
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          className={loading ? 'is-loading' : ''}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            if (Number.isFinite(video.duration) && video.duration > 0) video.currentTime = Math.min(0.1, video.duration / 2);
          }}
          onLoadedData={() => setSettledSource(source)}
          onSeeked={() => setSettledSource(source)}
          onError={() => setSettledSource(source)}
        />
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
