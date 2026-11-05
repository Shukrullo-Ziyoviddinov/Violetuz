import React from 'react';
import { Link } from 'react-router-dom';
import { useContentLanguage } from '../context/ContentLanguageContext';
import { useImageReady } from '../utils/useImageReady';
import SkeletonLoader from '../components/SkeletonLoader/SkeletonLoader';
import ViewCount from '../components/ViewCount/ViewCount';
import './TrailerHomeCard.css';

const localized = (value, lang) => typeof value === 'string' ? value
  : value?.[lang] || value?.uz || value?.ru || Object.values(value || {}).find((text) => typeof text === 'string' && text) || '';

export default function TrailerHomeCard({ item }) {
  const { contentLang } = useContentLanguage();
  const title = localized(item.title, contentLang) || localized(item.movieTitle, contentLang);
  const source = localized(item.trillerimg, contentLang);
  const trailerId = item.trailerId ?? item.id;
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(source);
  return <Link className="trailer-home-card" to={`/movie/${encodeURIComponent(item.movieId)}/trailer?trailerId=${encodeURIComponent(trailerId)}`}>
    <div className="trailer-home-card-image-wrap">
      {showSkeleton && <SkeletonLoader variant="triller-card-image" />}
      {!failed && source && <img ref={imgRef} src={source} alt={title} decoding="async" draggable={false}
        className={`trailer-home-card-image${showSkeleton ? ' trailer-home-card-image--loading' : ''}`}
        onLoad={onLoad} onError={onError} />}
    </div>
    <h3 className="trailer-home-card-title">{title}</h3>
    <div className="trailer-home-card-meta-row">
      <ViewCount itemId={`${item.movieId}-${trailerId}`} type="trailer" variant="text" record={false} />
    </div>
  </Link>;
}
