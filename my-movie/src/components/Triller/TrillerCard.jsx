import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { getLocalizedField } from '../../utils/shortsMovieUtils';
import { useImageReady } from '../../utils/useImageReady';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import './TrillerCard.css';

const TrillerCard = ({ triller, className = '', onSelect }) => {
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();

  const title = triller ? getLocalizedField(triller.title, contentLang) : '';
  const videoImg = triller ? getLocalizedField(triller.videoImg, contentLang) || '' : '';
  const { showSkeleton: showImgSkeleton, imgRef, onLoad, onError, failed: imgFailed } =
    useImageReady(videoImg);

  if (!triller) return null;

  const handleClick = () => {
    if (showImgSkeleton) return;
    if (onSelect) {
      onSelect(triller);
      return;
    }
    navigate(`/triller/${triller.id}`);
  };

  return (
    <button
      type="button"
      className={`triller-card${showImgSkeleton ? ' triller-card--loading' : ''}${
        className ? ` ${className}` : ''
      }`}
      onClick={handleClick}
      aria-busy={showImgSkeleton || undefined}
    >
      <div className="triller-card-image-wrap">
        {showImgSkeleton ? <SkeletonLoader variant="triller-card-image" /> : null}
        {!imgFailed && videoImg ? (
          <img
            ref={imgRef}
            src={videoImg}
            alt={title || ''}
            className={`triller-card-image${
              showImgSkeleton ? ' triller-card-image--loading' : ''
            }`}
            loading="lazy"
            onLoad={onLoad}
            onError={onError}
          />
        ) : null}
      </div>
      {showImgSkeleton ? (
        <SkeletonLoader variant="triller-card-title" />
      ) : title ? (
        <h3 className="triller-card-title">{title}</h3>
      ) : null}
    </button>
  );
};

export default TrillerCard;
